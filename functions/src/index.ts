import * as admin from "firebase-admin";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import axios from "axios";

admin.initializeApp();
const db = admin.firestore();

const PAYSTACK_SECRET = defineSecret("PAYSTACK_SECRET_KEY");

// ─── Types ────────────────────────────────────────────────────────────────────

interface InitiatePaymentData {
  orderId: string;
  email: string;
  amountKobo: number;
  metadata?: Record<string, string>;
}

interface VerifyPaymentData {
  reference: string;
  orderId: string;
}

interface CompleteAdminInviteData {
  inviteCode: string;
  name: string;
}

interface RemoveAdminUserData {
  targetUid: string;
}

interface PurgeRetiredRoleData {
  roleId: string;
}

interface SendAdminInviteData {
  inviteCode: string;
  email: string;
  name?: string;
  roleName?: string;
}

function normalizeRoleName(value: string): string {
  return value.trim().toLowerCase();
}

function getAdminRank(roleName: string): number {
  const normalized = normalizeRoleName(roleName);
  if (normalized === "admin" || normalized === "owner") {
    return 2;
  }
  if (normalized === "sub-admin" || normalized === "subadmin" || normalized === "manager") {
    return 1;
  }
  return 0;
}

function canonicalAdminRoleName(roleName: string): string {
  const rank = getAdminRank(roleName);
  if (rank >= 2) {
    return "Admin";
  }
  if (rank === 1) {
    return "Sub-Admin";
  }
  return roleName.trim();
}

function getRoleRank(role: { name?: string; rank?: unknown }): number {
  if (typeof role.rank === "number" && Number.isFinite(role.rank)) {
    return role.rank;
  }
  return getAdminRank(role.name ?? "");
}

async function getActorProfile(uid: string) {
  const snapshot = await db.collection("admin_users").doc(uid).get();
  return snapshot.exists ? snapshot.data() as { name?: string; email?: string; roleName?: string } : null;
}

async function assertAdmin(uid: string) {
  const actor = await getActorProfile(uid);
  if (!actor || getAdminRank(actor.roleName ?? "") < 2) {
    throw new HttpsError("permission-denied", "Only an admin can perform this action.");
  }
  return actor;
}

async function assertAdminOrSubAdmin(uid: string) {
  const actor = await getActorProfile(uid);
  if (!actor || getAdminRank(actor.roleName ?? "") < 1) {
    throw new HttpsError("permission-denied", "Admin or sub-admin access required.");
  }
  return actor;
}

async function getEmployeeProfile(uid: string) {
  const directSnap = await db.collection("employees").doc(uid).get();
  if (directSnap.exists) {
    return { id: directSnap.id, ...directSnap.data() } as Record<string, unknown>;
  }
  const byUidSnap = await db.collection("employees").where("uid", "==", uid).limit(1).get();
  if (byUidSnap.empty) return null;
  return { id: byUidSnap.docs[0].id, ...byUidSnap.docs[0].data() } as Record<string, unknown>;
}

async function getEmployeePermissions(uid: string): Promise<string[]> {
  const employee = await getEmployeeProfile(uid);
  if (!employee || employee.status === "suspended") return [];
  const roleId = typeof employee.roleId === "string" ? employee.roleId : "";
  if (!roleId) return [];
  const roleSnap = await db.collection("roles").doc(roleId).get();
  const permissions = roleSnap.data()?.permissions;
  return Array.isArray(permissions) ? permissions.map(String) : [];
}

function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes(permission);
}

async function writeAuditLog(uid: string, payload: {
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  details: string;
}) {
  const actor = await getActorProfile(uid);
  await db.collection("admin_audit_logs").add({
    actorUid: uid,
    actorName: actor?.name ?? "",
    actorEmail: actor?.email ?? "",
    action: payload.action,
    targetType: payload.targetType,
    targetId: payload.targetId,
    targetLabel: payload.targetLabel,
    details: payload.details,
    createdAtIso: new Date().toISOString()
  });
}

// ─── Abandoned Payment Timeout ───────────────────────────────────────────────
// Runs every 30 minutes. Cancels orders stuck in pending_payment for > 30 mins.

export const cancelAbandonedOrders = onSchedule("every 30 minutes", async () => {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const stuckOrders = await db.collection("orders")
    .where("status", "==", "pending_payment")
    .where("createdAt", "<", cutoff)
    .get();

  if (stuckOrders.empty) return;

  const batch = db.batch();
  stuckOrders.docs.forEach((doc) => {
    batch.update(doc.ref, {
      status: "cancelled",
      cancelReason: "payment_timeout",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  await batch.commit();
});

// ─── Cancel Pending Order ────────────────────────────────────────────────────
// Called when card charge fails after order was already created.
// Marks the order as cancelled so it doesn't stay stuck as pending_payment.

export const cancelPendingOrder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const { orderId } = request.data as { orderId: string };
  if (!orderId) throw new HttpsError("invalid-argument", "orderId is required.");

  const orderDoc = await db.collection("orders").doc(orderId).get();
  if (!orderDoc.exists || orderDoc.data()?.userId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Order not found.");
  }

  if (orderDoc.data()?.status !== "pending_payment") {
    throw new HttpsError("failed-precondition", "Only pending_payment orders can be cancelled this way.");
  }

  await db.collection("orders").doc(orderId).update({
    status: "cancelled",
    cancelReason: "payment_failed",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { ok: true };
});

// ─── Charge Card (Native) ─────────────────────────────────────────────────────
// Charges a card directly via Paystack API — no WebView needed.

interface ChargeCardData {
  orderId: string;
  email: string;
  amountKobo: number;
  cardNumber: string;
  cvv: string;
  expiryMonth: string;
  expiryYear: string;
}

interface SubmitChallengData {
  reference: string;
  type: "pin" | "otp";
  value: string;
}

export const chargeCard = onCall(
  { secrets: [PAYSTACK_SECRET] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const { orderId, email, amountKobo, cardNumber, cvv, expiryMonth, expiryYear } = request.data as ChargeCardData;

    if (!orderId || !email || !amountKobo || !cardNumber || !cvv || !expiryMonth || !expiryYear) {
      throw new HttpsError("invalid-argument", "All card fields are required.");
    }

    // Verify the order belongs to this user
    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists || orderDoc.data()?.userId !== request.auth.uid) {
      throw new HttpsError("permission-denied", "Order not found.");
    }

    const reference = `smag-${orderId}-${Date.now()}`;

    try {
      const response = await axios.post(
        "https://api.paystack.co/transaction/charge",
        {
          email,
          amount: amountKobo,
          card: {
            number: cardNumber,
            cvv,
            expiry_month: expiryMonth,
            expiry_year: expiryYear
          },
          reference,
          metadata: {
            orderId,
            userId: request.auth.uid
          }
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET.value()}`,
            "Content-Type": "application/json"
          }
        }
      );

      const txData = response.data.data;
      const status = txData.status as string;

      // Save payment record
      await db.collection("payments").doc(reference).set({
        orderId,
        userId: request.auth.uid,
        email,
        amountKobo,
        reference,
        status,
        paystackId: txData.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // If successful immediately, confirm order
      if (status === "success") {
        await confirmPayment(orderId, reference, amountKobo, request.auth.uid);
      }

      return {
        status,
        reference,
        displayText: txData.display_text ?? null
      };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      throw new HttpsError(
        "internal",
        error.response?.data?.message ?? error.message ?? "Card charge failed."
      );
    }
  }
);

// ─── Submit Charge Challenge ──────────────────────────────────────────────────
// Submits PIN or OTP for 3DS/challenge flows.

export const submitChargeChallenge = onCall(
  { secrets: [PAYSTACK_SECRET] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const { reference, type, value } = request.data as SubmitChallengData;

    if (!reference || !type || !value) {
      throw new HttpsError("invalid-argument", "reference, type, and value are required.");
    }

    try {
      const response = await axios.post(
        "https://api.paystack.co/transaction/submit_pin",
        {
          reference,
          [type]: value
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET.value()}`,
            "Content-Type": "application/json"
          }
        }
      );

      const txData = response.data.data;
      const status = txData.status as string;

      // Update payment record
      await db.collection("payments").doc(reference).update({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // If successful, confirm order
      if (status === "success") {
        const paymentDoc = await db.collection("payments").doc(reference).get();
        const paymentData = paymentDoc.data() as { orderId: string; amountKobo: number };
        await confirmPayment(paymentData.orderId, reference, paymentData.amountKobo, request.auth.uid);
      }

      return {
        status,
        displayText: txData.display_text ?? null
      };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      throw new HttpsError(
        "internal",
        error.response?.data?.message ?? error.message ?? "Challenge submission failed."
      );
    }
  }
);

// ─── Helper: Confirm Payment ──────────────────────────────────────────────────

async function confirmPayment(orderId: string, reference: string, amountKobo: number, userId: string) {
  const amountNaira = amountKobo / 100;
  const points = Math.floor(amountNaira / 100);

  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();
  const currentPoints = (userSnap.data()?.points as number) ?? 0;

  await Promise.all([
    db.collection("orders").doc(orderId).update({
      status: "confirmed",
      paymentStatus: "paid",
      paymentReference: reference,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }),
    userRef.update({ points: currentPoints + points }),
    db.collection("points_history").add({
      userId,
      title: "Order Paid",
      meta: `Order #${orderId.slice(-4).toUpperCase()}`,
      points,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }),
    db.collection("notifications").add({
      userId,
      title: "Payment Confirmed! 🎉",
      body: `₦${amountNaira.toLocaleString()} paid successfully. Your order is being prepared.`,
      type: "order_update",
      read: false,
      orderId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
  ]);
}

// ─── Initiate Payment ─────────────────────────────────────────────────────────
// Called from the app before showing the payment form.
// Returns a Paystack access_code + authorization_url.

export const initiatePayment = onCall(
  { secrets: [PAYSTACK_SECRET] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const { orderId, email, amountKobo, metadata } = request.data as InitiatePaymentData;

    if (!orderId || !email || !amountKobo) {
      throw new HttpsError("invalid-argument", "orderId, email and amountKobo are required.");
    }

    // Verify the order belongs to this user
    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists || orderDoc.data()?.userId !== request.auth.uid) {
      throw new HttpsError("permission-denied", "Order not found.");
    }

    try {
      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,
          amount: amountKobo,
          currency: "NGN",
          reference: `smag-${orderId}-${Date.now()}`,
          metadata: {
            orderId,
            userId: request.auth.uid,
            ...metadata
          },
          channels: ["card", "bank", "ussd", "bank_transfer", "mobile_money"]
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET.value()}`,
            "Content-Type": "application/json"
          }
        }
      );

      const { access_code, authorization_url, reference } = response.data.data;

      // Save pending payment reference to Firestore
      await db.collection("payments").doc(reference).set({
        orderId,
        userId: request.auth.uid,
        email,
        amountKobo,
        reference,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { access_code, authorization_url, reference };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      throw new HttpsError(
        "internal",
        error.response?.data?.message ?? error.message ?? "Payment initiation failed."
      );
    }
  }
);

// ─── Verify Payment ───────────────────────────────────────────────────────────
// Called after Paystack redirects back to confirm payment succeeded.

export const verifyPayment = onCall(
  { secrets: [PAYSTACK_SECRET] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const { reference, orderId } = request.data as VerifyPaymentData;

    if (!reference || !orderId) {
      throw new HttpsError("invalid-argument", "reference and orderId are required.");
    }

    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET.value()}` }
        }
      );

      const txData = response.data.data;
      const status = txData.status as string;
      const paidAmountKobo = txData.amount as number;

      // Update payment record
      await db.collection("payments").doc(reference).update({
        status,
        paidAmountKobo,
        paystackId: txData.id,
        channel: txData.channel,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      if (status === "success") {
        // Mark order as confirmed + paid
        await db.collection("orders").doc(orderId).update({
          status: "confirmed",
          paymentStatus: "paid",
          paymentReference: reference,
          paymentChannel: txData.channel,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Award loyalty points: 1 pt per ₦100
        const amountNaira = paidAmountKobo / 100;
        const points = Math.floor(amountNaira / 100);
        const userRef = db.collection("users").doc(request.auth.uid);
        const userSnap = await userRef.get();
        const currentPoints = (userSnap.data()?.points as number) ?? 0;

        await Promise.all([
          userRef.update({ points: currentPoints + points }),
          db.collection("points_history").add({
            userId: request.auth.uid,
            title: "Order Paid",
            meta: `Order #${orderId.slice(-4).toUpperCase()} via ${txData.channel}`,
            points,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          }),
          db.collection("notifications").add({
            userId: request.auth.uid,
            title: "Payment Confirmed! 🎉",
            body: `₦${amountNaira.toLocaleString()} paid successfully. Your order is being prepared.`,
            type: "order_update",
            read: false,
            orderId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          })
        ]);

        return { success: true, status, channel: txData.channel, points };
      }

      return { success: false, status };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      throw new HttpsError(
        "internal",
        error.response?.data?.message ?? error.message ?? "Payment verification failed."
      );
    }
  }
);

// ─── Paystack Webhook ─────────────────────────────────────────────────────────
// Receives server-side events from Paystack (charge.success, refund, etc.)

export const paystackWebhook = onRequest(
  { secrets: [PAYSTACK_SECRET] },
  async (req, res) => {
    // Verify webhook signature
    const crypto = await import("crypto");
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET.value())
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      res.status(401).send("Invalid signature");
      return;
    }

    const event = req.body as { event: string; data: Record<string, unknown> };

    if (event.event === "charge.success") {
      const reference = event.data.reference as string;
      const paymentDoc = await db.collection("payments").doc(reference).get();

      if (paymentDoc.exists && paymentDoc.data()?.status !== "success") {
        const { orderId, userId } = paymentDoc.data() as { orderId: string; userId: string };
        const amountKobo = event.data.amount as number;
        const amountNaira = amountKobo / 100;

        await Promise.all([
          db.collection("payments").doc(reference).update({
            status: "success",
            webhookConfirmed: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }),
          db.collection("orders").doc(orderId).update({
            status: "confirmed",
            paymentStatus: "paid",
            paymentReference: reference,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }),
          db.collection("notifications").add({
            userId,
            title: "Payment Confirmed! 🎉",
            body: `₦${amountNaira.toLocaleString()} received. Your order is confirmed.`,
            type: "order_update",
            read: false,
            orderId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          })
        ]);
      }
    }

    res.status(200).send("OK");
  }
);

export const completeAdminInvite = onCall(async (request) => {
  if (!request.auth?.uid || !request.auth.token.email) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const { inviteCode, name } = request.data as CompleteAdminInviteData;
  if (!inviteCode || !name?.trim()) {
    throw new HttpsError("invalid-argument", "inviteCode and name are required.");
  }

  const adminRef = db.collection("admin_users").doc(request.auth.uid);
  const existingAdmin = await adminRef.get();
  if (existingAdmin.exists) {
    throw new HttpsError("already-exists", "This account already has admin access.");
  }

  const inviteRef = db.collection("admin_invites").doc(inviteCode.trim());
  const inviteSnap = await inviteRef.get();
  if (!inviteSnap.exists) {
    throw new HttpsError("not-found", "Invite code not found.");
  }

  const invite = inviteSnap.data() as {
    email?: string;
    roleName?: string;
    used?: boolean;
    createdByUid?: string;
    createdAtIso?: string;
  };

  const authEmail = String(request.auth.token.email).toLowerCase();
  if ((invite.email ?? "").toLowerCase() !== authEmail) {
    throw new HttpsError("permission-denied", "Invite email does not match this account.");
  }
  if (invite.used) {
    throw new HttpsError("failed-precondition", "This invite has already been used.");
  }

  const matchingRoles = await db.collection("roles").where("name", "==", invite.roleName ?? "").limit(1).get();
  const validRole = matchingRoles.docs.find((doc) => doc.data().deleted !== true);
  if (!validRole) {
    throw new HttpsError("failed-precondition", "This invite points to a retired role.");
  }

  await adminRef.set({
    uid: request.auth.uid,
    email: authEmail,
    name: name.trim(),
    roleName: invite.roleName,
    inviteId: inviteCode.trim()
  });

  await inviteRef.update({
    used: true,
    usedByUid: request.auth.uid,
    usedByEmail: authEmail,
    usedAtIso: new Date().toISOString()
  });

  await writeAuditLog(request.auth.uid, {
    action: "admin_invite_completed",
    targetType: "admin_user",
    targetId: request.auth.uid,
    targetLabel: authEmail,
    details: `${name.trim()} completed admin onboarding with ${invite.roleName ?? "assigned"} access.`
  });

  return { ok: true, roleName: invite.roleName ?? "" };
});

export const sendAdminInvite = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const actor = await assertAdmin(request.auth.uid);
  const { inviteCode, email, name, roleName } = request.data as SendAdminInviteData;
  if (!inviteCode?.trim() || !email?.trim()) {
    throw new HttpsError("invalid-argument", "inviteCode and email are required.");
  }

  const resolvedRoleName = canonicalAdminRoleName(roleName ?? "");
  const adminUrl = process.env.SMAG_ADMIN_APP_URL ?? "https://smag-admin.web.app";

  await db.collection("mail").add({
    to: email.trim().toLowerCase(),
    message: {
      subject: `You've been invited to Smag Admin`,
      html: `
        <h2>Hello ${name?.trim() || email.trim().split("@")[0] || "there"},</h2>
        <p>${actor.name ?? actor.email ?? "A Smag admin"} invited you to the Smag Admin workspace.</p>
        <p>Your access level: <strong>${resolvedRoleName || "Admin"}</strong></p>
        <p>Use this invite code when you choose <strong>Create admin</strong> on the login screen:</p>
        <p style="font-size:20px;font-weight:700;letter-spacing:1px;">${inviteCode.trim()}</p>
        <p><a href="${adminUrl}" style="background:#a33800;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Open Smag Admin</a></p>
        <p>If you already have a Firebase password for this email, you can sign in right away after your invite is active.</p>
      `
    }
  });

  return { ok: true };
});

export const removeAdminUser = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const actor = await assertAdmin(request.auth.uid);
  const { targetUid } = request.data as RemoveAdminUserData;
  if (!targetUid?.trim()) {
    throw new HttpsError("invalid-argument", "targetUid is required.");
  }
  if (targetUid === request.auth.uid) {
    throw new HttpsError("failed-precondition", "You cannot remove your own admin access.");
  }

  const adminRef = db.collection("admin_users").doc(targetUid.trim());
  const targetSnap = await adminRef.get();
  if (!targetSnap.exists) {
    throw new HttpsError("not-found", "Admin user not found.");
  }

  const targetData = targetSnap.data() as { name?: string; email?: string; roleName?: string };
  if (getAdminRank(targetData.roleName ?? "") >= getAdminRank(actor.roleName ?? "")) {
    throw new HttpsError("permission-denied", "You can only remove admin users with a lower rank than yours.");
  }
  await adminRef.delete();

  try {
    await admin.auth().deleteUser(targetUid.trim());
  } catch (error: unknown) {
    const authError = error as { code?: string };
    if (authError.code !== "auth/user-not-found") {
      throw error;
    }
  }

  await writeAuditLog(request.auth.uid, {
    action: "admin_access_removed",
    targetType: "admin_user",
    targetId: targetUid.trim(),
    targetLabel: targetData.name ?? targetData.email ?? targetUid.trim(),
    details: `${actor.name ?? actor.email ?? "Owner"} removed admin access for ${targetData.name ?? targetData.email ?? targetUid.trim()}.`
  });

  return { ok: true };
});

export const clearResolvedInvites = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  await assertAdmin(request.auth.uid);
  const resolvedInvites = await db.collection("admin_invites").where("used", "==", true).get();
  const batch = db.batch();
  resolvedInvites.docs.forEach((invite) => batch.delete(invite.ref));
  await batch.commit();

  await writeAuditLog(request.auth.uid, {
    action: "resolved_invites_cleared",
    targetType: "admin_invite",
    targetId: "resolved-invites",
    targetLabel: "Resolved invites",
    details: `Cleared ${resolvedInvites.size} resolved invite records from the queue.`
  });

  return { ok: true, count: resolvedInvites.size };
});

// ─── Check App Version ───────────────────────────────────────────────────────
// Returns whether the client version is supported.
// Set min_version in Firestore: app_config/version { min_version: "1.1.0" }

export const checkAppVersion = onCall(async (request) => {
  const { version } = request.data as { version: string };
  if (!version) throw new HttpsError("invalid-argument", "version is required.");

  const configDoc = await db.collection("app_config").doc("version").get();
  const minVersion = (configDoc.data()?.min_version as string) ?? "1.0.0";

  function parseVer(v: string) {
    return v.split(".").map(Number);
  }

  const [mj, mn, pt] = parseVer(version);
  const [rmj, rmn, rpt] = parseVer(minVersion);
  const supported =
    mj > rmj || (mj === rmj && mn > rmn) || (mj === rmj && mn === rmn && pt >= rpt);

  return { supported, minVersion };
});

// ─── Approve Driver Application ──────────────────────────────────────────────

export const approveDriverApplication = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Must be signed in.");
  await assertAdminOrSubAdmin(request.auth.uid);

  const { applicationId } = request.data as { applicationId: string };
  if (!applicationId) throw new HttpsError("invalid-argument", "applicationId is required.");

  const appRef = db.collection("driver_applications").doc(applicationId);
  const appSnap = await appRef.get();
  if (!appSnap.exists) throw new HttpsError("not-found", "Application not found.");

  const application = appSnap.data() as {
    email: string; name: string; phone: string;
    vehicleType: string; vehiclePlate: string; status: string;
  };
  if (application.status !== "pending") throw new HttpsError("failed-precondition", "Only pending applications can be approved.");

  // Create Firebase Auth account
  let uid: string;
  try {
    const existing = await admin.auth().getUserByEmail(application.email);
    uid = existing.uid;
  } catch {
    const created = await admin.auth().createUser({ email: application.email, displayName: application.name });
    uid = created.uid;
  }

  // Find or create Driver role
  const driverRoleSnap = await db.collection("roles").where("name", "==", "Driver").limit(1).get();
  let driverRoleId: string;
  if (driverRoleSnap.empty) {
    const newRole = await db.collection("roles").add({
      name: "Driver",
      description: "Delivery driver",
      permissions: ["business_access", "business_driver"],
      rank: 0,
      adminScope: false,
      deleted: false
    });
    driverRoleId = newRole.id;
  } else {
    driverRoleId = driverRoleSnap.docs[0].id;
    await driverRoleSnap.docs[0].ref.set({
      permissions: admin.firestore.FieldValue.arrayUnion("business_access", "business_driver"),
      rank: 0,
      adminScope: false,
      deleted: false
    }, { merge: true });
  }

  // Create employee record keyed by auth uid so staff apps and rules can resolve it safely.
  await db.collection("employees").doc(uid).set({
    uid,
    name: application.name,
    email: application.email,
    phone: application.phone,
    roleId: driverRoleId,
    status: "active",
    vehicleType: application.vehicleType,
    vehiclePlate: application.vehiclePlate,
    inviteSentAt: new Date().toISOString()
  });

  // Update application
  await appRef.update({ status: "approved", uid, approvedAtIso: new Date().toISOString() });

  // Send setup email
  const setupLink = await admin.auth().generatePasswordResetLink(application.email, {
    url: process.env.SMAG_BUSINESS_APP_URL ?? "smag-business://setup"
  });

  await db.collection("mail").add({
    to: application.email,
    message: {
      subject: "You've been approved as a Smag Driver!",
      html: `
        <h2>Welcome to the Smag Driver team, ${application.name}!</h2>
        <p>Your driver application has been approved.</p>
        <p>Click below to set up your password and start accepting deliveries:</p>
        <p><a href="${setupLink}" style="background:#ff7941;color:#1a0d06;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Set Up My Driver Account</a></p>
        <p>This link expires in 24 hours.</p>
        <p>— The Smag Team</p>
      `
    }
  });

  await writeAuditLog(request.auth.uid, {
    action: "driver_approved",
    targetType: "driver_application",
    targetId: applicationId,
    targetLabel: application.name,
    details: `Approved driver ${application.name} (${application.email}). Setup email sent.`
  });

  return { ok: true, uid };
});

export const rejectDriverApplication = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Must be signed in.");
  await assertAdminOrSubAdmin(request.auth.uid);

  const { applicationId, reason } = request.data as { applicationId: string; reason?: string };
  if (!applicationId) throw new HttpsError("invalid-argument", "applicationId is required.");

  const appRef = db.collection("driver_applications").doc(applicationId);
  const appSnap = await appRef.get();
  if (!appSnap.exists) throw new HttpsError("not-found", "Application not found.");

  const application = appSnap.data() as { email: string; name: string; status: string };
  if (application.status !== "pending") throw new HttpsError("failed-precondition", "Only pending applications can be rejected.");

  await appRef.update({
    status: "rejected",
    rejectionReason: reason ?? "Does not meet current requirements.",
    reviewedAtIso: new Date().toISOString()
  });

  await db.collection("mail").add({
    to: application.email,
    message: {
      subject: "Update on your Smag Driver application",
      html: `<h2>Hi ${application.name},</h2><p>Thank you for applying. Unfortunately we are unable to approve your application at this time.</p>${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}<p>— The Smag Team</p>`
    }
  });

  return { ok: true };
});

// ─── Send Employee Invite Email ──────────────────────────────────────────────
// Called from admin when an employee is added.
// Creates a Firebase Auth password-reset link (acts as setup link) and emails it.

export const sendEmployeeInvite = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Must be signed in.");
  await assertAdminOrSubAdmin(request.auth.uid);

  const { employeeId, email, name, roleName } = request.data as {
    employeeId: string;
    email: string;
    name: string;
    roleName: string;
  };
  if (!employeeId || !email || !name) throw new HttpsError("invalid-argument", "employeeId, email, and name are required.");

  // Create Firebase Auth user if not exists, then generate password setup link
  let uid: string;
  try {
    const existing = await admin.auth().getUserByEmail(email);
    uid = existing.uid;
  } catch {
    const created = await admin.auth().createUser({ email, displayName: name });
    uid = created.uid;
  }

  const employeeRef = db.collection("employees").doc(employeeId);
  const employeeSnap = await employeeRef.get();
  const existingEmployee = employeeSnap.exists ? employeeSnap.data() as Record<string, unknown> : {};
  const roleNameSnap = await db.collection("roles").where("name", "==", roleName).limit(1).get();
  const rolePermissions = roleNameSnap.empty ? [] : roleNameSnap.docs[0].data().permissions;
  const canUseBusinessApp = Array.isArray(rolePermissions) && rolePermissions.map(String).includes("business_access");

  if (!canUseBusinessApp) {
    return { ok: true, skipped: true, reason: "role_without_business_access" };
  }

  const canonicalEmployeeRef = db.collection("employees").doc(uid);
  const inviteSentAt = new Date().toISOString();

  await canonicalEmployeeRef.set({
    ...existingEmployee,
    uid,
    email,
    name,
    inviteSentAt
  }, { merge: true });

  if (employeeId !== uid && employeeSnap.exists) {
    await employeeRef.delete();
  }

  // Generate password setup link
  const setupLink = await admin.auth().generatePasswordResetLink(email, {
    url: process.env.SMAG_BUSINESS_APP_URL ?? "smag-business://setup"
  });

  // Send email via Firebase Extensions (Trigger Email) or fallback log
  await db.collection("mail").add({
    to: email,
    message: {
      subject: `You've been added to Smag — Set up your account`,
      html: `
        <h2>Welcome to Smag, ${name}!</h2>
        <p>You've been added as a <strong>${roleName}</strong> on the Smag platform.</p>
        <p>Click the button below to set up your password and access the Smag Business app:</p>
        <p><a href="${setupLink}" style="background:#a33800;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Set Up My Account</a></p>
        <p>This link expires in 24 hours.</p>
        <p>— The Smag Team</p>
      `
    }
  });

  await writeAuditLog(request.auth.uid, {
    action: "employee_invite_sent",
    targetType: "employee",
    targetId: employeeId,
    targetLabel: email,
    details: `Setup invite sent to ${name} (${email}) for ${roleName} role.`
  });

  return { ok: true, uid };
});

// ─── Approve Kitchen Application ─────────────────────────────────────────────
// Approves a pending kitchen, creates their Firebase Auth account,
// sends them a password setup link, and marks them as approved.

export const approveKitchenApplication = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Must be signed in.");
  await assertAdminOrSubAdmin(request.auth.uid);

  const { applicationId } = request.data as { applicationId: string };
  if (!applicationId) throw new HttpsError("invalid-argument", "applicationId is required.");

  const appRef = db.collection("kitchen_applications").doc(applicationId);
  const appSnap = await appRef.get();
  if (!appSnap.exists) throw new HttpsError("not-found", "Application not found.");

  const application = appSnap.data() as {
    email: string;
    businessName: string;
    ownerName: string;
    cuisine: string;
    address: string;
    status: string;
  };

  if (application.status !== "pending") {
    throw new HttpsError("failed-precondition", "Only pending applications can be approved.");
  }

  // Create Firebase Auth account for kitchen owner
  let ownerUid: string;
  try {
    const existing = await admin.auth().getUserByEmail(application.email);
    ownerUid = existing.uid;
  } catch {
    const created = await admin.auth().createUser({
      email: application.email,
      displayName: application.ownerName
    });
    ownerUid = created.uid;
  }

  // Create external_restaurant document
  const restaurantRef = db.collection("external_restaurants").doc();
  await restaurantRef.set({
    name: application.businessName,
    cuisine: application.cuisine,
    address: application.address,
    imageUrl: "",
    rating: 0,
    reviewCount: 0,
    deliveryMinutes: "30-45",
    deliveryFee: 500,
    minimumOrder: 2000,
    isOpen: false,
    latitude: 0,
    longitude: 0,
    tags: [],
    status: "approved",
    ownerEmail: application.email,
    ownerUid,
    approvedAtIso: new Date().toISOString()
  });

  // Store kitchen owner profile
  await db.collection("kitchen_owners").doc(ownerUid).set({
    uid: ownerUid,
    email: application.email,
    name: application.ownerName,
    restaurantId: restaurantRef.id,
    restaurantName: application.businessName,
    role: "kitchen_owner"
  });

  // Update application status
  await appRef.update({
    status: "approved",
    restaurantId: restaurantRef.id,
    ownerUid,
    reviewedByUid: request.auth.uid,
    reviewedAtIso: new Date().toISOString()
  });

  // Generate password setup link
  const setupLink = await admin.auth().generatePasswordResetLink(application.email, {
    url: process.env.SMAG_BUSINESS_APP_URL ?? "smag-business://setup"
  });

  // Send approval email
  await db.collection("mail").add({
    to: application.email,
    message: {
      subject: `Your kitchen "${application.businessName}" has been approved on Smag!`,
      html: `
        <h2>Congratulations, ${application.ownerName}!</h2>
        <p>Your kitchen <strong>${application.businessName}</strong> has been approved and is now listed on Smag.</p>
        <p>Click below to set up your password and start managing your menu and orders:</p>
        <p><a href="${setupLink}" style="background:#a33800;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Set Up My Kitchen Account</a></p>
        <p>This link expires in 24 hours.</p>
        <p>— The Smag Team</p>
      `
    }
  });

  await writeAuditLog(request.auth.uid, {
    action: "kitchen_approved",
    targetType: "kitchen_application",
    targetId: applicationId,
    targetLabel: application.businessName,
    details: `Approved kitchen ${application.businessName} (${application.email}). Restaurant ID: ${restaurantRef.id}.`
  });

  return { ok: true, restaurantId: restaurantRef.id, ownerUid };
});

// ─── Reject Kitchen Application ───────────────────────────────────────────────

export const rejectKitchenApplication = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Must be signed in.");
  await assertAdminOrSubAdmin(request.auth.uid);

  const { applicationId, reason } = request.data as { applicationId: string; reason?: string };
  if (!applicationId) throw new HttpsError("invalid-argument", "applicationId is required.");

  const appRef = db.collection("kitchen_applications").doc(applicationId);
  const appSnap = await appRef.get();
  if (!appSnap.exists) throw new HttpsError("not-found", "Application not found.");

  const application = appSnap.data() as { email: string; businessName: string; ownerName: string; status: string };
  if (application.status !== "pending") throw new HttpsError("failed-precondition", "Only pending applications can be rejected.");

  await appRef.update({
    status: "rejected",
    rejectionReason: reason ?? "Does not meet current listing requirements.",
    reviewedByUid: request.auth.uid,
    reviewedAtIso: new Date().toISOString()
  });

  await db.collection("mail").add({
    to: application.email,
    message: {
      subject: `Update on your Smag kitchen application`,
      html: `
        <h2>Hi ${application.ownerName},</h2>
        <p>Thank you for applying to list <strong>${application.businessName}</strong> on Smag.</p>
        <p>After review, we are unable to approve your application at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        <p>You are welcome to reapply once the issues have been addressed.</p>
        <p>— The Smag Team</p>
      `
    }
  });

  await writeAuditLog(request.auth.uid, {
    action: "kitchen_rejected",
    targetType: "kitchen_application",
    targetId: applicationId,
    targetLabel: application.businessName,
    details: `Rejected kitchen application for ${application.businessName}. Reason: ${reason ?? "Not specified"}.`
  });

  return { ok: true };
});

// ─── Update Order Status (Admin/Driver) ───────────────────────────────────────

export const updateOrderStatus = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Must be signed in.");

  const { orderId, status, driverUid, driverName, driverVehicle, driverAvatarUrl } = request.data as {
    orderId: string;
    status: string;
    driverUid?: string;
    driverName?: string;
    driverVehicle?: string;
    driverAvatarUrl?: string;
  };

  const validStatuses = ["confirmed", "preparing", "on_delivery", "delivered", "cancelled"];
  if (!orderId || !validStatuses.includes(status)) {
    throw new HttpsError("invalid-argument", "Valid orderId and status are required.");
  }

  const orderRef = db.collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) throw new HttpsError("not-found", "Order not found.");

  const orderData = orderSnap.data() as {
    userId: string;
    status: string;
    restaurantId?: string;
    assignedDriverUid?: string | null;
  };

  const [isAdmin, kitchenOwnerSnap, employeePermissions] = await Promise.all([
    db.collection("admin_users").doc(request.auth.uid).get(),
    db.collection("kitchen_owners").doc(request.auth.uid).get(),
    getEmployeePermissions(request.auth.uid)
  ]);

  const isBusinessManager = hasPermission(employeePermissions, "business_team") && hasPermission(employeePermissions, "business_orders");
  const canHandleOrders = hasPermission(employeePermissions, "business_orders");
  const canDrive = hasPermission(employeePermissions, "business_driver");
  const kitchenOwner = kitchenOwnerSnap.exists ? kitchenOwnerSnap.data() as { restaurantId?: string } : null;
  const ownsKitchenOrder = Boolean(kitchenOwner?.restaurantId && kitchenOwner.restaurantId === orderData.restaurantId);
  const restaurantSnap = orderData.restaurantId
    ? await db.collection("external_restaurants").doc(orderData.restaurantId).get()
    : null;
  const isExternalOrder = Boolean(restaurantSnap?.exists);
  const isAssignedDriver = orderData.assignedDriverUid === request.auth.uid;
  const isDriverPickup = canDrive && status === "on_delivery" && (!orderData.assignedDriverUid || isAssignedDriver);
  const isDriverDeliveryComplete = canDrive && status === "delivered" && isAssignedDriver;
  const isKitchenFlow = ["preparing", "on_delivery", "cancelled"].includes(status);

  if (!isAdmin.exists && !isBusinessManager && !ownsKitchenOrder && !(canHandleOrders && !isExternalOrder) && !isDriverPickup && !isDriverDeliveryComplete) {
    throw new HttpsError("permission-denied", "Your role cannot update this order.");
  }

  if ((ownsKitchenOrder || (canHandleOrders && !isExternalOrder)) && !isKitchenFlow) {
    throw new HttpsError("permission-denied", "Kitchen roles can only prepare, release, or cancel orders.");
  }

  const update: Record<string, unknown> = {
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  if (driverName) update.driverName = driverName;
  if (driverVehicle) update.driverVehicle = driverVehicle;
  if (driverAvatarUrl) update.driverAvatarUrl = driverAvatarUrl;
  if (status === "on_delivery" && (driverUid || canDrive)) {
    update.assignedDriverUid = driverUid ?? request.auth.uid;
  }

  await orderRef.update(update);

  // Notify the customer
  const statusMessages: Record<string, string> = {
    confirmed: "Your order has been confirmed and is being prepared.",
    preparing: "The kitchen is now preparing your order.",
    on_delivery: `Your order is on the way${driverName ? ` with ${driverName}` : ""}.`,
    delivered: "Your order has been delivered. Enjoy your meal!",
    cancelled: "Your order has been cancelled."
  };

  await db.collection("notifications").add({
    userId: orderData.userId,
    title: status === "delivered" ? "Order Delivered! 🎉" : status === "cancelled" ? "Order Cancelled" : "Order Update",
    body: statusMessages[status] ?? `Order status updated to ${status}.`,
    type: "order_update",
    read: false,
    orderId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { ok: true };
});

// ─── Update Driver Location ───────────────────────────────────────────────────
// Called by driver app every ~10 seconds while on delivery.

export const updateDriverLocation = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Must be signed in.");

  const { orderId, latitude, longitude } = request.data as {
    orderId: string;
    latitude: number;
    longitude: number;
  };

  if (!orderId || latitude == null || longitude == null) {
    throw new HttpsError("invalid-argument", "orderId, latitude, and longitude are required.");
  }

  const orderSnap = await db.collection("orders").doc(orderId).get();
  if (!orderSnap.exists) throw new HttpsError("not-found", "Order not found.");
  if (orderSnap.data()?.assignedDriverUid !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Only the assigned driver can broadcast location for this order.");
  }

  await db.collection("orders").doc(orderId).update({
    driverLat: latitude,
    driverLng: longitude,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { ok: true };
});

// ─── Broadcast Push Notification ─────────────────────────────────────────────
// Sends a notification to all users or a specific segment.

export const broadcastNotification = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Must be signed in.");
  await assertAdminOrSubAdmin(request.auth.uid);

  const { title, body, targetAudience, targetUserId } = request.data as {
    title: string;
    body: string;
    targetAudience: "all" | "tier_pro" | "tier_elite" | "specific_user";
    targetUserId?: string;
  };

  if (!title || !body || !targetAudience) {
    throw new HttpsError("invalid-argument", "title, body, and targetAudience are required.");
  }

  const actor = await getActorProfile(request.auth.uid);

  // Log the broadcast
  await db.collection("broadcast_notifications").add({
    title,
    body,
    targetAudience,
    targetUserId: targetUserId ?? null,
    sentAtIso: new Date().toISOString(),
    sentByUid: request.auth.uid,
    sentByName: actor?.name ?? actor?.email ?? "Admin"
  });

  // Write to notifications collection for targeted users
  if (targetAudience === "specific_user" && targetUserId) {
    await db.collection("notifications").add({
      userId: targetUserId,
      title,
      body,
      type: "system",
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } else {
    // For broad audiences, write a broadcast doc that the app reads on next open
    await db.collection("app_broadcasts").add({
      title,
      body,
      targetAudience,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  }

  await writeAuditLog(request.auth.uid, {
    action: "broadcast_sent",
    targetType: "notification",
    targetId: targetAudience,
    targetLabel: title,
    details: `Broadcast "${title}" sent to ${targetAudience}${targetUserId ? ` (${targetUserId})` : ""}.`
  });

  return { ok: true };
});

// ─── Submit Order Review & Update Restaurant Rating ───────────────────────────────
// Called after a review is written to order_reviews.
// Recalculates the restaurant's average rating.

export const onReviewCreated = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Must be signed in.");

  const { orderId, restaurantId, foodRating, driverRating, review } = request.data as {
    orderId: string;
    restaurantId?: string;
    foodRating: number;
    driverRating: number;
    review?: string;
  };

  if (!orderId || !foodRating) throw new HttpsError("invalid-argument", "orderId and foodRating are required.");

  // Write the review
  await db.collection("order_reviews").add({
    orderId,
    userId: request.auth.uid,
    restaurantId: restaurantId ?? null,
    foodRating,
    driverRating,
    review: review?.trim() ?? "",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // If restaurantId provided, recalculate average rating
  if (restaurantId) {
    const reviewsSnap = await db.collection("order_reviews")
      .where("restaurantId", "==", restaurantId)
      .get();

    if (!reviewsSnap.empty) {
      const total = reviewsSnap.docs.reduce((sum, d) => sum + (d.data().foodRating as number ?? 0), 0);
      const avg = Math.round((total / reviewsSnap.size) * 10) / 10;
      await db.collection("external_restaurants").doc(restaurantId).update({
        rating: avg,
        reviewCount: reviewsSnap.size
      });
    }
  }

  return { ok: true };
});

// ─── On Order Delivered ──────────────────────────────────────────────────────
// Triggered when an order status changes to "delivered".
// Awards referral points to the referrer if this is the referee's first order,
// creates a referral entry, and issues a welcome voucher to the referee.

export const onOrderDelivered = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Must be signed in.");

  const { orderId } = request.data as { orderId: string };
  if (!orderId) throw new HttpsError("invalid-argument", "orderId is required.");

  const orderSnap = await db.collection("orders").doc(orderId).get();
  if (!orderSnap.exists) throw new HttpsError("not-found", "Order not found.");

  const order = orderSnap.data() as {
    userId: string;
    status: string;
    total: number;
    restaurantName: string;
  };

  if (order.status !== "delivered") {
    throw new HttpsError("failed-precondition", "Order is not delivered yet.");
  }

  const userId = order.userId;
  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();
  const userData = userSnap.data() ?? {};

  // Increment total orders count on user doc
  await userRef.set({
    totalOrders: (userData.totalOrders as number ?? 0) + 1,
    totalSpend: (userData.totalSpend as number ?? 0) + order.total
  }, { merge: true });

  // Check if this is the user's first delivered order
  const previousOrders = await db.collection("orders")
    .where("userId", "==", userId)
    .where("status", "==", "delivered")
    .limit(2)
    .get();

  const isFirstOrder = previousOrders.size <= 1;

  if (isFirstOrder) {
    // Issue a welcome voucher to the new user
    const voucherExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await db.collection("vouchers").add({
      userId,
      title: "Welcome to Smag!",
      amount: "₦5,000 OFF",
      minOrder: 20000,
      expiresAt: voucherExpiry,
      used: false,
      usedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection("notifications").add({
      userId,
      title: "Welcome Voucher Unlocked! 🎁",
      body: "You've earned a ₦5,000 welcome voucher. Use it on your next order!",
      type: "promo",
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Check if this user was referred by someone
    const usedReferralCode = userData.usedReferralCode as string | undefined;

    if (usedReferralCode) {
      // Find the referrer by their referral code
      const referrerSnap = await db.collection("users")
        .where("referralCode", "==", usedReferralCode)
        .limit(1)
        .get();

      if (!referrerSnap.empty) {
        const referrerDoc = referrerSnap.docs[0];
        const referrerId = referrerDoc.id;
        const referrerData = referrerDoc.data();
        const REFERRAL_POINTS = 250;
        const currentReferrerPoints = (referrerData.points as number) ?? 0;
        const currentReferralCount = (referrerData.referralCount as number) ?? 0;

        await Promise.all([
          // Award points to referrer
          referrerDoc.ref.update({
            points: currentReferrerPoints + REFERRAL_POINTS,
            referralCount: currentReferralCount + 1
          }),
          // Points history for referrer
          db.collection("points_history").add({
            userId: referrerId,
            title: "Referral Reward",
            meta: `${userData.fullName ?? userData.displayName ?? "A friend"} placed their first order`,
            points: REFERRAL_POINTS,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          }),
          // Referral history entry
          db.collection("referrals").add({
            referrerId,
            refereeId: userId,
            refereeName: String(userData.fullName ?? userData.displayName ?? "New User"),
            status: "completed",
            pointsAwarded: REFERRAL_POINTS,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          }),
          // Notify referrer
          db.collection("notifications").add({
            userId: referrerId,
            title: "Referral Reward! 🎉",
            body: `${userData.fullName ?? "Your friend"} placed their first order. You earned ${REFERRAL_POINTS} points!`,
            type: "promo",
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          }),
          // Issue ₦10,000 voucher to referrer
          db.collection("vouchers").add({
            userId: referrerId,
            title: "Referral Reward",
            amount: "₦10,000 OFF",
            minOrder: 25000,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            used: false,
            usedAt: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          }),
          // Issue ₦10,000 voucher to referee too
          db.collection("vouchers").add({
            userId,
            title: "Referral Welcome Bonus",
            amount: "₦10,000 OFF",
            minOrder: 25000,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            used: false,
            usedAt: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          })
        ]);

        // Mark referral code as processed so it doesn't fire again
        await userRef.update({ usedReferralCode: admin.firestore.FieldValue.delete() });
      }
    }
  }

  return { ok: true, isFirstOrder };
});

// ─── Auto-hide Out-of-Stock Foods ───────────────────────────────────────────────
// Runs every hour. Hides any food item with stock = 0.

export const autoHideOutOfStockFoods = onSchedule("every 60 minutes", async () => {
  const outOfStock = await db.collection("foods")
    .where("stock", "==", 0)
    .where("status", "==", "active")
    .get();

  if (outOfStock.empty) return;

  const batch = db.batch();
  outOfStock.docs.forEach((d) => batch.update(d.ref, { status: "hidden" }));
  await batch.commit();
});

export const purgeRetiredRole = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const actor = await assertAdminOrSubAdmin(request.auth.uid);
  const { roleId } = request.data as PurgeRetiredRoleData;
  if (!roleId?.trim()) {
    throw new HttpsError("invalid-argument", "roleId is required.");
  }

  const roleRef = db.collection("roles").doc(roleId.trim());
  const roleSnap = await roleRef.get();
  if (!roleSnap.exists) {
    throw new HttpsError("not-found", "Role not found.");
  }

  const role = roleSnap.data() as { name?: string; deleted?: boolean; rank?: number };
  if (!role.deleted && normalizeRoleName(role.name ?? "") !== "deleted role") {
    throw new HttpsError("failed-precondition", "Only retired roles can be cleared permanently.");
  }
  if (getRoleRank(role) >= getAdminRank(actor.roleName ?? "")) {
    throw new HttpsError("permission-denied", "You can only purge roles with a lower rank than yours.");
  }

  const [linkedAdmins, linkedEmployees] = await Promise.all([
    db.collection("admin_users").where("roleName", "==", role.name ?? "").limit(1).get(),
    db.collection("employees").where("roleId", "==", roleId.trim()).limit(1).get()
  ]);
  if (!linkedAdmins.empty || !linkedEmployees.empty) {
    throw new HttpsError("failed-precondition", "Reassign linked admins or employees before clearing this role.");
  }

  await roleRef.delete();
  await writeAuditLog(request.auth.uid, {
    action: "retired_role_cleared",
    targetType: "role",
    targetId: roleId.trim(),
    targetLabel: role.name ?? roleId.trim(),
    details: `Permanently cleared retired role record ${role.name ?? roleId.trim()}.`
  });

  return { ok: true };
});
