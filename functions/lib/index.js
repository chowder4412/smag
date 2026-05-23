"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purgeRetiredRole = exports.autoHideOutOfStockFoods = exports.onOrderDelivered = exports.onReviewCreated = exports.broadcastNotification = exports.updateDriverLocation = exports.updateOrderStatus = exports.rejectKitchenApplication = exports.approveKitchenApplication = exports.sendEmployeeInvite = exports.rejectDriverApplication = exports.approveDriverApplication = exports.checkAppVersion = exports.clearResolvedInvites = exports.removeAdminUser = exports.sendAdminInvite = exports.completeAdminInvite = exports.paystackWebhook = exports.verifyPayment = exports.initiatePayment = exports.submitChargeChallenge = exports.chargeCard = exports.cancelPendingOrder = exports.cancelAbandonedOrders = void 0;
const admin = require("firebase-admin");
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const params_1 = require("firebase-functions/params");
const axios_1 = require("axios");
admin.initializeApp();
const db = admin.firestore();
const PAYSTACK_SECRET = (0, params_1.defineSecret)("PAYSTACK_SECRET_KEY");
function normalizeRoleName(value) {
    return value.trim().toLowerCase();
}
function getAdminRank(roleName) {
    const normalized = normalizeRoleName(roleName);
    if (normalized === "admin" || normalized === "owner") {
        return 2;
    }
    if (normalized === "sub-admin" || normalized === "subadmin" || normalized === "manager") {
        return 1;
    }
    return 0;
}
function canonicalAdminRoleName(roleName) {
    const rank = getAdminRank(roleName);
    if (rank >= 2) {
        return "Admin";
    }
    if (rank === 1) {
        return "Sub-Admin";
    }
    return roleName.trim();
}
function getRoleRank(role) {
    var _a;
    if (typeof role.rank === "number" && Number.isFinite(role.rank)) {
        return role.rank;
    }
    return getAdminRank((_a = role.name) !== null && _a !== void 0 ? _a : "");
}
async function getActorProfile(uid) {
    const snapshot = await db.collection("admin_users").doc(uid).get();
    return snapshot.exists ? snapshot.data() : null;
}
async function assertAdmin(uid) {
    var _a;
    const actor = await getActorProfile(uid);
    if (!actor || getAdminRank((_a = actor.roleName) !== null && _a !== void 0 ? _a : "") < 2) {
        throw new https_1.HttpsError("permission-denied", "Only an admin can perform this action.");
    }
    return actor;
}
async function assertAdminOrSubAdmin(uid) {
    var _a;
    const actor = await getActorProfile(uid);
    if (!actor || getAdminRank((_a = actor.roleName) !== null && _a !== void 0 ? _a : "") < 1) {
        throw new https_1.HttpsError("permission-denied", "Admin or sub-admin access required.");
    }
    return actor;
}
async function getEmployeeProfile(uid) {
    const directSnap = await db.collection("employees").doc(uid).get();
    if (directSnap.exists) {
        return Object.assign({ id: directSnap.id }, directSnap.data());
    }
    const byUidSnap = await db.collection("employees").where("uid", "==", uid).limit(1).get();
    if (byUidSnap.empty)
        return null;
    return Object.assign({ id: byUidSnap.docs[0].id }, byUidSnap.docs[0].data());
}
async function getEmployeePermissions(uid) {
    var _a;
    const employee = await getEmployeeProfile(uid);
    if (!employee || employee.status === "suspended")
        return [];
    const roleId = typeof employee.roleId === "string" ? employee.roleId : "";
    if (!roleId)
        return [];
    const roleSnap = await db.collection("roles").doc(roleId).get();
    const permissions = (_a = roleSnap.data()) === null || _a === void 0 ? void 0 : _a.permissions;
    return Array.isArray(permissions) ? permissions.map(String) : [];
}
function hasPermission(permissions, permission) {
    return permissions.includes(permission);
}
async function writeAuditLog(uid, payload) {
    var _a, _b;
    const actor = await getActorProfile(uid);
    await db.collection("admin_audit_logs").add({
        actorUid: uid,
        actorName: (_a = actor === null || actor === void 0 ? void 0 : actor.name) !== null && _a !== void 0 ? _a : "",
        actorEmail: (_b = actor === null || actor === void 0 ? void 0 : actor.email) !== null && _b !== void 0 ? _b : "",
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
exports.cancelAbandonedOrders = (0, scheduler_1.onSchedule)("every 30 minutes", async () => {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);
    const stuckOrders = await db.collection("orders")
        .where("status", "==", "pending_payment")
        .where("createdAt", "<", cutoff)
        .get();
    if (stuckOrders.empty)
        return;
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
exports.cancelPendingOrder = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    }
    const { orderId } = request.data;
    if (!orderId)
        throw new https_1.HttpsError("invalid-argument", "orderId is required.");
    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists || ((_a = orderDoc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== request.auth.uid) {
        throw new https_1.HttpsError("permission-denied", "Order not found.");
    }
    if (((_b = orderDoc.data()) === null || _b === void 0 ? void 0 : _b.status) !== "pending_payment") {
        throw new https_1.HttpsError("failed-precondition", "Only pending_payment orders can be cancelled this way.");
    }
    await db.collection("orders").doc(orderId).update({
        status: "cancelled",
        cancelReason: "payment_failed",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { ok: true };
});
exports.chargeCard = (0, https_1.onCall)({ secrets: [PAYSTACK_SECRET] }, async (request) => {
    var _a, _b, _c, _d, _e, _f;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    }
    const { orderId, email, amountKobo, cardNumber, cvv, expiryMonth, expiryYear } = request.data;
    if (!orderId || !email || !amountKobo || !cardNumber || !cvv || !expiryMonth || !expiryYear) {
        throw new https_1.HttpsError("invalid-argument", "All card fields are required.");
    }
    // Verify the order belongs to this user
    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists || ((_a = orderDoc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== request.auth.uid) {
        throw new https_1.HttpsError("permission-denied", "Order not found.");
    }
    const reference = `smag-${orderId}-${Date.now()}`;
    try {
        const response = await axios_1.default.post("https://api.paystack.co/transaction/charge", {
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
        }, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET.value()}`,
                "Content-Type": "application/json"
            }
        });
        const txData = response.data.data;
        const status = txData.status;
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
            displayText: (_b = txData.display_text) !== null && _b !== void 0 ? _b : null
        };
    }
    catch (err) {
        const error = err;
        throw new https_1.HttpsError("internal", (_f = (_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) !== null && _e !== void 0 ? _e : error.message) !== null && _f !== void 0 ? _f : "Card charge failed.");
    }
});
// ─── Submit Charge Challenge ──────────────────────────────────────────────────
// Submits PIN or OTP for 3DS/challenge flows.
exports.submitChargeChallenge = (0, https_1.onCall)({ secrets: [PAYSTACK_SECRET] }, async (request) => {
    var _a, _b, _c, _d, _e;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    }
    const { reference, type, value } = request.data;
    if (!reference || !type || !value) {
        throw new https_1.HttpsError("invalid-argument", "reference, type, and value are required.");
    }
    try {
        const response = await axios_1.default.post("https://api.paystack.co/transaction/submit_pin", {
            reference,
            [type]: value
        }, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET.value()}`,
                "Content-Type": "application/json"
            }
        });
        const txData = response.data.data;
        const status = txData.status;
        // Update payment record
        await db.collection("payments").doc(reference).update({
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // If successful, confirm order
        if (status === "success") {
            const paymentDoc = await db.collection("payments").doc(reference).get();
            const paymentData = paymentDoc.data();
            await confirmPayment(paymentData.orderId, reference, paymentData.amountKobo, request.auth.uid);
        }
        return {
            status,
            displayText: (_a = txData.display_text) !== null && _a !== void 0 ? _a : null
        };
    }
    catch (err) {
        const error = err;
        throw new https_1.HttpsError("internal", (_e = (_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) !== null && _d !== void 0 ? _d : error.message) !== null && _e !== void 0 ? _e : "Challenge submission failed.");
    }
});
// ─── Helper: Confirm Payment ──────────────────────────────────────────────────
async function confirmPayment(orderId, reference, amountKobo, userId) {
    var _a, _b;
    const amountNaira = amountKobo / 100;
    const points = Math.floor(amountNaira / 100);
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    const currentPoints = (_b = (_a = userSnap.data()) === null || _a === void 0 ? void 0 : _a.points) !== null && _b !== void 0 ? _b : 0;
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
exports.initiatePayment = (0, https_1.onCall)({ secrets: [PAYSTACK_SECRET] }, async (request) => {
    var _a, _b, _c, _d, _e;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    }
    const { orderId, email, amountKobo, metadata } = request.data;
    if (!orderId || !email || !amountKobo) {
        throw new https_1.HttpsError("invalid-argument", "orderId, email and amountKobo are required.");
    }
    // Verify the order belongs to this user
    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists || ((_a = orderDoc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== request.auth.uid) {
        throw new https_1.HttpsError("permission-denied", "Order not found.");
    }
    try {
        const response = await axios_1.default.post("https://api.paystack.co/transaction/initialize", {
            email,
            amount: amountKobo,
            currency: "NGN",
            reference: `smag-${orderId}-${Date.now()}`,
            metadata: Object.assign({ orderId, userId: request.auth.uid }, metadata),
            channels: ["card", "bank", "ussd", "bank_transfer", "mobile_money"]
        }, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET.value()}`,
                "Content-Type": "application/json"
            }
        });
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
    }
    catch (err) {
        const error = err;
        throw new https_1.HttpsError("internal", (_e = (_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) !== null && _d !== void 0 ? _d : error.message) !== null && _e !== void 0 ? _e : "Payment initiation failed.");
    }
});
// ─── Verify Payment ───────────────────────────────────────────────────────────
// Called after Paystack redirects back to confirm payment succeeded.
exports.verifyPayment = (0, https_1.onCall)({ secrets: [PAYSTACK_SECRET] }, async (request) => {
    var _a, _b, _c, _d, _e, _f;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    }
    const { reference, orderId } = request.data;
    if (!reference || !orderId) {
        throw new https_1.HttpsError("invalid-argument", "reference and orderId are required.");
    }
    try {
        const response = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET.value()}` }
        });
        const txData = response.data.data;
        const status = txData.status;
        const paidAmountKobo = txData.amount;
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
            const currentPoints = (_b = (_a = userSnap.data()) === null || _a === void 0 ? void 0 : _a.points) !== null && _b !== void 0 ? _b : 0;
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
    }
    catch (err) {
        const error = err;
        throw new https_1.HttpsError("internal", (_f = (_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) !== null && _e !== void 0 ? _e : error.message) !== null && _f !== void 0 ? _f : "Payment verification failed.");
    }
});
// ─── Paystack Webhook ─────────────────────────────────────────────────────────
// Receives server-side events from Paystack (charge.success, refund, etc.)
exports.paystackWebhook = (0, https_1.onRequest)({ secrets: [PAYSTACK_SECRET] }, async (req, res) => {
    var _a;
    // Verify webhook signature
    const crypto = await Promise.resolve().then(() => require("crypto"));
    const hash = crypto
        .createHmac("sha512", PAYSTACK_SECRET.value())
        .update(JSON.stringify(req.body))
        .digest("hex");
    if (hash !== req.headers["x-paystack-signature"]) {
        res.status(401).send("Invalid signature");
        return;
    }
    const event = req.body;
    if (event.event === "charge.success") {
        const reference = event.data.reference;
        const paymentDoc = await db.collection("payments").doc(reference).get();
        if (paymentDoc.exists && ((_a = paymentDoc.data()) === null || _a === void 0 ? void 0 : _a.status) !== "success") {
            const { orderId, userId } = paymentDoc.data();
            const amountKobo = event.data.amount;
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
});
exports.completeAdminInvite = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid) || !request.auth.token.email) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    }
    const { inviteCode, name } = request.data;
    if (!inviteCode || !(name === null || name === void 0 ? void 0 : name.trim())) {
        throw new https_1.HttpsError("invalid-argument", "inviteCode and name are required.");
    }
    const adminRef = db.collection("admin_users").doc(request.auth.uid);
    const existingAdmin = await adminRef.get();
    if (existingAdmin.exists) {
        throw new https_1.HttpsError("already-exists", "This account already has admin access.");
    }
    const inviteRef = db.collection("admin_invites").doc(inviteCode.trim());
    const inviteSnap = await inviteRef.get();
    if (!inviteSnap.exists) {
        throw new https_1.HttpsError("not-found", "Invite code not found.");
    }
    const invite = inviteSnap.data();
    const authEmail = String(request.auth.token.email).toLowerCase();
    if (((_b = invite.email) !== null && _b !== void 0 ? _b : "").toLowerCase() !== authEmail) {
        throw new https_1.HttpsError("permission-denied", "Invite email does not match this account.");
    }
    if (invite.used) {
        throw new https_1.HttpsError("failed-precondition", "This invite has already been used.");
    }
    const matchingRoles = await db.collection("roles").where("name", "==", (_c = invite.roleName) !== null && _c !== void 0 ? _c : "").limit(1).get();
    const validRole = matchingRoles.docs.find((doc) => doc.data().deleted !== true);
    if (!validRole) {
        throw new https_1.HttpsError("failed-precondition", "This invite points to a retired role.");
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
        details: `${name.trim()} completed admin onboarding with ${(_d = invite.roleName) !== null && _d !== void 0 ? _d : "assigned"} access.`
    });
    return { ok: true, roleName: (_e = invite.roleName) !== null && _e !== void 0 ? _e : "" };
});
exports.sendAdminInvite = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    }
    const actor = await assertAdmin(request.auth.uid);
    const { inviteCode, email, name, roleName } = request.data;
    if (!(inviteCode === null || inviteCode === void 0 ? void 0 : inviteCode.trim()) || !(email === null || email === void 0 ? void 0 : email.trim())) {
        throw new https_1.HttpsError("invalid-argument", "inviteCode and email are required.");
    }
    const resolvedRoleName = canonicalAdminRoleName(roleName !== null && roleName !== void 0 ? roleName : "");
    const adminUrl = (_b = process.env.SMAG_ADMIN_APP_URL) !== null && _b !== void 0 ? _b : "https://smag-admin.web.app";
    await db.collection("mail").add({
        to: email.trim().toLowerCase(),
        message: {
            subject: `You've been invited to Smag Admin`,
            html: `
        <h2>Hello ${(name === null || name === void 0 ? void 0 : name.trim()) || email.trim().split("@")[0] || "there"},</h2>
        <p>${(_d = (_c = actor.name) !== null && _c !== void 0 ? _c : actor.email) !== null && _d !== void 0 ? _d : "A Smag admin"} invited you to the Smag Admin workspace.</p>
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
exports.removeAdminUser = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    }
    const actor = await assertAdmin(request.auth.uid);
    const { targetUid } = request.data;
    if (!(targetUid === null || targetUid === void 0 ? void 0 : targetUid.trim())) {
        throw new https_1.HttpsError("invalid-argument", "targetUid is required.");
    }
    if (targetUid === request.auth.uid) {
        throw new https_1.HttpsError("failed-precondition", "You cannot remove your own admin access.");
    }
    const adminRef = db.collection("admin_users").doc(targetUid.trim());
    const targetSnap = await adminRef.get();
    if (!targetSnap.exists) {
        throw new https_1.HttpsError("not-found", "Admin user not found.");
    }
    const targetData = targetSnap.data();
    if (getAdminRank((_b = targetData.roleName) !== null && _b !== void 0 ? _b : "") >= getAdminRank((_c = actor.roleName) !== null && _c !== void 0 ? _c : "")) {
        throw new https_1.HttpsError("permission-denied", "You can only remove admin users with a lower rank than yours.");
    }
    await adminRef.delete();
    try {
        await admin.auth().deleteUser(targetUid.trim());
    }
    catch (error) {
        const authError = error;
        if (authError.code !== "auth/user-not-found") {
            throw error;
        }
    }
    await writeAuditLog(request.auth.uid, {
        action: "admin_access_removed",
        targetType: "admin_user",
        targetId: targetUid.trim(),
        targetLabel: (_e = (_d = targetData.name) !== null && _d !== void 0 ? _d : targetData.email) !== null && _e !== void 0 ? _e : targetUid.trim(),
        details: `${(_g = (_f = actor.name) !== null && _f !== void 0 ? _f : actor.email) !== null && _g !== void 0 ? _g : "Owner"} removed admin access for ${(_j = (_h = targetData.name) !== null && _h !== void 0 ? _h : targetData.email) !== null && _j !== void 0 ? _j : targetUid.trim()}.`
    });
    return { ok: true };
});
exports.clearResolvedInvites = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
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
exports.checkAppVersion = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    const { version } = request.data;
    if (!version)
        throw new https_1.HttpsError("invalid-argument", "version is required.");
    const configDoc = await db.collection("app_config").doc("version").get();
    const minVersion = (_b = (_a = configDoc.data()) === null || _a === void 0 ? void 0 : _a.min_version) !== null && _b !== void 0 ? _b : "1.0.0";
    function parseVer(v) {
        return v.split(".").map(Number);
    }
    const [mj, mn, pt] = parseVer(version);
    const [rmj, rmn, rpt] = parseVer(minVersion);
    const supported = mj > rmj || (mj === rmj && mn > rmn) || (mj === rmj && mn === rmn && pt >= rpt);
    return { supported, minVersion };
});
// ─── Approve Driver Application ──────────────────────────────────────────────
exports.approveDriverApplication = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid))
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    await assertAdminOrSubAdmin(request.auth.uid);
    const { applicationId } = request.data;
    if (!applicationId)
        throw new https_1.HttpsError("invalid-argument", "applicationId is required.");
    const appRef = db.collection("driver_applications").doc(applicationId);
    const appSnap = await appRef.get();
    if (!appSnap.exists)
        throw new https_1.HttpsError("not-found", "Application not found.");
    const application = appSnap.data();
    if (application.status !== "pending")
        throw new https_1.HttpsError("failed-precondition", "Only pending applications can be approved.");
    // Create Firebase Auth account
    let uid;
    try {
        const existing = await admin.auth().getUserByEmail(application.email);
        uid = existing.uid;
    }
    catch (_c) {
        const created = await admin.auth().createUser({ email: application.email, displayName: application.name });
        uid = created.uid;
    }
    // Find or create Driver role
    const driverRoleSnap = await db.collection("roles").where("name", "==", "Driver").limit(1).get();
    let driverRoleId;
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
    }
    else {
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
        url: (_b = process.env.SMAG_BUSINESS_APP_URL) !== null && _b !== void 0 ? _b : "smag-business://setup"
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
exports.rejectDriverApplication = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid))
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    await assertAdminOrSubAdmin(request.auth.uid);
    const { applicationId, reason } = request.data;
    if (!applicationId)
        throw new https_1.HttpsError("invalid-argument", "applicationId is required.");
    const appRef = db.collection("driver_applications").doc(applicationId);
    const appSnap = await appRef.get();
    if (!appSnap.exists)
        throw new https_1.HttpsError("not-found", "Application not found.");
    const application = appSnap.data();
    if (application.status !== "pending")
        throw new https_1.HttpsError("failed-precondition", "Only pending applications can be rejected.");
    await appRef.update({
        status: "rejected",
        rejectionReason: reason !== null && reason !== void 0 ? reason : "Does not meet current requirements.",
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
exports.sendEmployeeInvite = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid))
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    await assertAdminOrSubAdmin(request.auth.uid);
    const { employeeId, email, name, roleName } = request.data;
    if (!employeeId || !email || !name)
        throw new https_1.HttpsError("invalid-argument", "employeeId, email, and name are required.");
    // Create Firebase Auth user if not exists, then generate password setup link
    let uid;
    try {
        const existing = await admin.auth().getUserByEmail(email);
        uid = existing.uid;
    }
    catch (_c) {
        const created = await admin.auth().createUser({ email, displayName: name });
        uid = created.uid;
    }
    const employeeRef = db.collection("employees").doc(employeeId);
    const employeeSnap = await employeeRef.get();
    const existingEmployee = employeeSnap.exists ? employeeSnap.data() : {};
    const roleNameSnap = await db.collection("roles").where("name", "==", roleName).limit(1).get();
    const rolePermissions = roleNameSnap.empty ? [] : roleNameSnap.docs[0].data().permissions;
    const canUseBusinessApp = Array.isArray(rolePermissions) && rolePermissions.map(String).includes("business_access");
    if (!canUseBusinessApp) {
        return { ok: true, skipped: true, reason: "role_without_business_access" };
    }
    const canonicalEmployeeRef = db.collection("employees").doc(uid);
    const inviteSentAt = new Date().toISOString();
    await canonicalEmployeeRef.set(Object.assign(Object.assign({}, existingEmployee), { uid,
        email,
        name,
        inviteSentAt }), { merge: true });
    if (employeeId !== uid && employeeSnap.exists) {
        await employeeRef.delete();
    }
    // Generate password setup link
    const setupLink = await admin.auth().generatePasswordResetLink(email, {
        url: (_b = process.env.SMAG_BUSINESS_APP_URL) !== null && _b !== void 0 ? _b : "smag-business://setup"
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
exports.approveKitchenApplication = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid))
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    await assertAdminOrSubAdmin(request.auth.uid);
    const { applicationId } = request.data;
    if (!applicationId)
        throw new https_1.HttpsError("invalid-argument", "applicationId is required.");
    const appRef = db.collection("kitchen_applications").doc(applicationId);
    const appSnap = await appRef.get();
    if (!appSnap.exists)
        throw new https_1.HttpsError("not-found", "Application not found.");
    const application = appSnap.data();
    if (application.status !== "pending") {
        throw new https_1.HttpsError("failed-precondition", "Only pending applications can be approved.");
    }
    // Create Firebase Auth account for kitchen owner
    let ownerUid;
    try {
        const existing = await admin.auth().getUserByEmail(application.email);
        ownerUid = existing.uid;
    }
    catch (_c) {
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
        url: (_b = process.env.SMAG_BUSINESS_APP_URL) !== null && _b !== void 0 ? _b : "smag-business://setup"
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
exports.rejectKitchenApplication = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid))
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    await assertAdminOrSubAdmin(request.auth.uid);
    const { applicationId, reason } = request.data;
    if (!applicationId)
        throw new https_1.HttpsError("invalid-argument", "applicationId is required.");
    const appRef = db.collection("kitchen_applications").doc(applicationId);
    const appSnap = await appRef.get();
    if (!appSnap.exists)
        throw new https_1.HttpsError("not-found", "Application not found.");
    const application = appSnap.data();
    if (application.status !== "pending")
        throw new https_1.HttpsError("failed-precondition", "Only pending applications can be rejected.");
    await appRef.update({
        status: "rejected",
        rejectionReason: reason !== null && reason !== void 0 ? reason : "Does not meet current listing requirements.",
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
        details: `Rejected kitchen application for ${application.businessName}. Reason: ${reason !== null && reason !== void 0 ? reason : "Not specified"}.`
    });
    return { ok: true };
});
// ─── Update Order Status (Admin/Driver) ───────────────────────────────────────
exports.updateOrderStatus = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid))
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    const { orderId, status, driverUid, driverName, driverVehicle, driverAvatarUrl } = request.data;
    const validStatuses = ["confirmed", "preparing", "on_delivery", "delivered", "cancelled"];
    if (!orderId || !validStatuses.includes(status)) {
        throw new https_1.HttpsError("invalid-argument", "Valid orderId and status are required.");
    }
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists)
        throw new https_1.HttpsError("not-found", "Order not found.");
    const orderData = orderSnap.data();
    const [isAdmin, kitchenOwnerSnap, employeePermissions] = await Promise.all([
        db.collection("admin_users").doc(request.auth.uid).get(),
        db.collection("kitchen_owners").doc(request.auth.uid).get(),
        getEmployeePermissions(request.auth.uid)
    ]);
    const isBusinessManager = hasPermission(employeePermissions, "business_team") && hasPermission(employeePermissions, "business_orders");
    const canHandleOrders = hasPermission(employeePermissions, "business_orders");
    const canDrive = hasPermission(employeePermissions, "business_driver");
    const kitchenOwner = kitchenOwnerSnap.exists ? kitchenOwnerSnap.data() : null;
    const ownsKitchenOrder = Boolean((kitchenOwner === null || kitchenOwner === void 0 ? void 0 : kitchenOwner.restaurantId) && kitchenOwner.restaurantId === orderData.restaurantId);
    const restaurantSnap = orderData.restaurantId
        ? await db.collection("external_restaurants").doc(orderData.restaurantId).get()
        : null;
    const isExternalOrder = Boolean(restaurantSnap === null || restaurantSnap === void 0 ? void 0 : restaurantSnap.exists);
    const isAssignedDriver = orderData.assignedDriverUid === request.auth.uid;
    const isDriverPickup = canDrive && status === "on_delivery" && (!orderData.assignedDriverUid || isAssignedDriver);
    const isDriverDeliveryComplete = canDrive && status === "delivered" && isAssignedDriver;
    const isKitchenFlow = ["preparing", "on_delivery", "cancelled"].includes(status);
    if (!isAdmin.exists && !isBusinessManager && !ownsKitchenOrder && !(canHandleOrders && !isExternalOrder) && !isDriverPickup && !isDriverDeliveryComplete) {
        throw new https_1.HttpsError("permission-denied", "Your role cannot update this order.");
    }
    if ((ownsKitchenOrder || (canHandleOrders && !isExternalOrder)) && !isKitchenFlow) {
        throw new https_1.HttpsError("permission-denied", "Kitchen roles can only prepare, release, or cancel orders.");
    }
    const update = {
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    if (driverName)
        update.driverName = driverName;
    if (driverVehicle)
        update.driverVehicle = driverVehicle;
    if (driverAvatarUrl)
        update.driverAvatarUrl = driverAvatarUrl;
    if (status === "on_delivery" && (driverUid || canDrive)) {
        update.assignedDriverUid = driverUid !== null && driverUid !== void 0 ? driverUid : request.auth.uid;
    }
    await orderRef.update(update);
    // Notify the customer
    const statusMessages = {
        confirmed: "Your order has been confirmed and is being prepared.",
        preparing: "The kitchen is now preparing your order.",
        on_delivery: `Your order is on the way${driverName ? ` with ${driverName}` : ""}.`,
        delivered: "Your order has been delivered. Enjoy your meal!",
        cancelled: "Your order has been cancelled."
    };
    await db.collection("notifications").add({
        userId: orderData.userId,
        title: status === "delivered" ? "Order Delivered! 🎉" : status === "cancelled" ? "Order Cancelled" : "Order Update",
        body: (_b = statusMessages[status]) !== null && _b !== void 0 ? _b : `Order status updated to ${status}.`,
        type: "order_update",
        read: false,
        orderId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    // ── Push notifications to business users ──────────────────────────────────
    const expoPushTokens = [];
    // New confirmed order → notify kitchen staff + kitchen owner
    if (status === "confirmed") {
        const [staffSnap, ownerSnap] = await Promise.all([
            db.collection("employees").where("status", "==", "active").get(),
            orderData.restaurantId
                ? db.collection("kitchen_owners").where("restaurantId", "==", orderData.restaurantId).limit(1).get()
                : Promise.resolve(null)
        ]);
        staffSnap.docs.forEach(d => { if (d.data().pushToken)
            expoPushTokens.push(d.data().pushToken); });
        ownerSnap === null || ownerSnap === void 0 ? void 0 : ownerSnap.docs.forEach(d => { if (d.data().pushToken)
            expoPushTokens.push(d.data().pushToken); });
    }
    // Order ready for pickup (on_delivery, unassigned) → notify all active drivers
    if (status === "on_delivery" && (!orderData.assignedDriverUid || orderData.assignedDriverUid === "")) {
        const driverRoleSnap = await db.collection("roles").where("name", "==", "Driver").limit(1).get();
        if (!driverRoleSnap.empty) {
            const driverEmpSnap = await db.collection("employees")
                .where("roleId", "==", driverRoleSnap.docs[0].id)
                .where("status", "==", "active").get();
            driverEmpSnap.docs.forEach(d => { if (d.data().pushToken)
                expoPushTokens.push(d.data().pushToken); });
        }
    }
    if (expoPushTokens.length > 0) {
        const pushTitle = status === "confirmed" ? "New Order! 🛎" : "Order Ready for Pickup 🚀";
        const pushBody = `Order #${orderId.slice(-6).toUpperCase()} · ${(_c = statusMessages[status]) !== null && _c !== void 0 ? _c : status}`;
        await axios_1.default.post("https://exp.host/--/api/v2/push/send", expoPushTokens.map(token => ({ to: token, title: pushTitle, body: pushBody, data: { orderId }, sound: "default" })), { headers: { "Content-Type": "application/json", Accept: "application/json" } }).catch(() => { });
    }
    return { ok: true };
});
// ─── Update Driver Location ───────────────────────────────────────────────────
// Called by driver app every ~10 seconds while on delivery.
exports.updateDriverLocation = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid))
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    const { orderId, latitude, longitude } = request.data;
    if (!orderId || latitude == null || longitude == null) {
        throw new https_1.HttpsError("invalid-argument", "orderId, latitude, and longitude are required.");
    }
    const orderSnap = await db.collection("orders").doc(orderId).get();
    if (!orderSnap.exists)
        throw new https_1.HttpsError("not-found", "Order not found.");
    if (((_b = orderSnap.data()) === null || _b === void 0 ? void 0 : _b.assignedDriverUid) !== request.auth.uid) {
        throw new https_1.HttpsError("permission-denied", "Only the assigned driver can broadcast location for this order.");
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
exports.broadcastNotification = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid))
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    await assertAdminOrSubAdmin(request.auth.uid);
    const { title, body, targetAudience, targetUserId } = request.data;
    if (!title || !body || !targetAudience) {
        throw new https_1.HttpsError("invalid-argument", "title, body, and targetAudience are required.");
    }
    const actor = await getActorProfile(request.auth.uid);
    // Log the broadcast
    await db.collection("broadcast_notifications").add({
        title,
        body,
        targetAudience,
        targetUserId: targetUserId !== null && targetUserId !== void 0 ? targetUserId : null,
        sentAtIso: new Date().toISOString(),
        sentByUid: request.auth.uid,
        sentByName: (_c = (_b = actor === null || actor === void 0 ? void 0 : actor.name) !== null && _b !== void 0 ? _b : actor === null || actor === void 0 ? void 0 : actor.email) !== null && _c !== void 0 ? _c : "Admin"
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
    }
    else {
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
exports.onReviewCreated = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid))
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    const { orderId, restaurantId, foodRating, driverRating, review } = request.data;
    if (!orderId || !foodRating)
        throw new https_1.HttpsError("invalid-argument", "orderId and foodRating are required.");
    // Write the review
    await db.collection("order_reviews").add({
        orderId,
        userId: request.auth.uid,
        restaurantId: restaurantId !== null && restaurantId !== void 0 ? restaurantId : null,
        foodRating,
        driverRating,
        review: (_b = review === null || review === void 0 ? void 0 : review.trim()) !== null && _b !== void 0 ? _b : "",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    // If restaurantId provided, recalculate average rating
    if (restaurantId) {
        const reviewsSnap = await db.collection("order_reviews")
            .where("restaurantId", "==", restaurantId)
            .get();
        if (!reviewsSnap.empty) {
            const total = reviewsSnap.docs.reduce((sum, d) => { var _a; return sum + ((_a = d.data().foodRating) !== null && _a !== void 0 ? _a : 0); }, 0);
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
exports.onOrderDelivered = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid))
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    const { orderId } = request.data;
    if (!orderId)
        throw new https_1.HttpsError("invalid-argument", "orderId is required.");
    const orderSnap = await db.collection("orders").doc(orderId).get();
    if (!orderSnap.exists)
        throw new https_1.HttpsError("not-found", "Order not found.");
    const order = orderSnap.data();
    if (order.status !== "delivered") {
        throw new https_1.HttpsError("failed-precondition", "Order is not delivered yet.");
    }
    const userId = order.userId;
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    const userData = (_b = userSnap.data()) !== null && _b !== void 0 ? _b : {};
    // Increment total orders count on user doc
    await userRef.set({
        totalOrders: ((_c = userData.totalOrders) !== null && _c !== void 0 ? _c : 0) + 1,
        totalSpend: ((_d = userData.totalSpend) !== null && _d !== void 0 ? _d : 0) + order.total
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
        const usedReferralCode = userData.usedReferralCode;
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
                const currentReferrerPoints = (_e = referrerData.points) !== null && _e !== void 0 ? _e : 0;
                const currentReferralCount = (_f = referrerData.referralCount) !== null && _f !== void 0 ? _f : 0;
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
                        meta: `${(_h = (_g = userData.fullName) !== null && _g !== void 0 ? _g : userData.displayName) !== null && _h !== void 0 ? _h : "A friend"} placed their first order`,
                        points: REFERRAL_POINTS,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    }),
                    // Referral history entry
                    db.collection("referrals").add({
                        referrerId,
                        refereeId: userId,
                        refereeName: String((_k = (_j = userData.fullName) !== null && _j !== void 0 ? _j : userData.displayName) !== null && _k !== void 0 ? _k : "New User"),
                        status: "completed",
                        pointsAwarded: REFERRAL_POINTS,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    }),
                    // Notify referrer
                    db.collection("notifications").add({
                        userId: referrerId,
                        title: "Referral Reward! 🎉",
                        body: `${(_l = userData.fullName) !== null && _l !== void 0 ? _l : "Your friend"} placed their first order. You earned ${REFERRAL_POINTS} points!`,
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
exports.autoHideOutOfStockFoods = (0, scheduler_1.onSchedule)("every 60 minutes", async () => {
    const outOfStock = await db.collection("foods")
        .where("stock", "==", 0)
        .where("status", "==", "active")
        .get();
    if (outOfStock.empty)
        return;
    const batch = db.batch();
    outOfStock.docs.forEach((d) => batch.update(d.ref, { status: "hidden" }));
    await batch.commit();
});
exports.purgeRetiredRole = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e, _f;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in.");
    }
    const actor = await assertAdminOrSubAdmin(request.auth.uid);
    const { roleId } = request.data;
    if (!(roleId === null || roleId === void 0 ? void 0 : roleId.trim())) {
        throw new https_1.HttpsError("invalid-argument", "roleId is required.");
    }
    const roleRef = db.collection("roles").doc(roleId.trim());
    const roleSnap = await roleRef.get();
    if (!roleSnap.exists) {
        throw new https_1.HttpsError("not-found", "Role not found.");
    }
    const role = roleSnap.data();
    if (!role.deleted && normalizeRoleName((_b = role.name) !== null && _b !== void 0 ? _b : "") !== "deleted role") {
        throw new https_1.HttpsError("failed-precondition", "Only retired roles can be cleared permanently.");
    }
    if (getRoleRank(role) >= getAdminRank((_c = actor.roleName) !== null && _c !== void 0 ? _c : "")) {
        throw new https_1.HttpsError("permission-denied", "You can only purge roles with a lower rank than yours.");
    }
    const [linkedAdmins, linkedEmployees] = await Promise.all([
        db.collection("admin_users").where("roleName", "==", (_d = role.name) !== null && _d !== void 0 ? _d : "").limit(1).get(),
        db.collection("employees").where("roleId", "==", roleId.trim()).limit(1).get()
    ]);
    if (!linkedAdmins.empty || !linkedEmployees.empty) {
        throw new https_1.HttpsError("failed-precondition", "Reassign linked admins or employees before clearing this role.");
    }
    await roleRef.delete();
    await writeAuditLog(request.auth.uid, {
        action: "retired_role_cleared",
        targetType: "role",
        targetId: roleId.trim(),
        targetLabel: (_e = role.name) !== null && _e !== void 0 ? _e : roleId.trim(),
        details: `Permanently cleared retired role record ${(_f = role.name) !== null && _f !== void 0 ? _f : roleId.trim()}.`
    });
    return { ok: true };
});
//# sourceMappingURL=index.js.map