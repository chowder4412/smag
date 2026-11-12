import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SmagHomeNative } from "@/screens/native/SmagHomeNative";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn()
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter
}));

jest.mock("@/lib/userProfile", () => ({
  getUserProfile: () => Promise.resolve({
    fullName: "Elena Rostova",
    address: "Plot 12 Victoria Island, Lagos",
    avatarUri: "https://example.com/avatar.jpg"
  }),
  subscribeUserProfile: (cb: (p: unknown) => void) => {
    cb({
      fullName: "Elena Rostova",
      address: "Plot 12 Victoria Island, Lagos",
      avatarUri: "https://example.com/avatar.jpg"
    });
    return () => {};
  }
}));

const mockPromotions = [
  {
    id: "promo-1",
    imageUrl: "https://example.com/promo1.jpg",
    tag: "Weekend Special",
    title: "30% Off Family Platters",
    subtitle: "Delicious party platters delivered hot.",
    active: true
  }
];

const mockPartnerMenuItems = [
  {
    id: "menu-partner-1",
    name: "Truffle Pasta",
    description: "Creamy truffle mushroom pasta",
    price: 14000,
    imageUrl: "https://example.com/pasta.jpg",
    category: "Main Course",
    available: true,
    restaurantId: "luigi"
  }
];

jest.mock("@/lib/firebase/firestore", () => ({
  subscribePromotions: (cb: (promos: unknown[]) => void) => {
    cb(mockPromotions);
    return () => {};
  },
  subscribeMenuItems: (_id: string, cb: (items: unknown[]) => void) => {
    cb(mockPartnerMenuItems);
    return () => {};
  }
}));

jest.mock("@/components/CartBadgeIcon", () => ({
  CartBadgeIcon: () => null
}));

describe("SmagHomeNative Screen", () => {
  beforeEach(() => {
    mockRouter.push.mockReset();
  });

  it("renders header with profile avatar, deliver-to address, and cart button", async () => {
    const { getByTestId, getByText } = render(<SmagHomeNative />);

    await waitFor(() => {
      expect(getByText("Plot 12 Victoria Island, Lagos")).toBeTruthy();
    });

    expect(getByTestId("home-profile-btn")).toBeTruthy();
    expect(getByTestId("home-delivery-address-btn")).toBeTruthy();
    expect(getByTestId("home-cart-btn")).toBeTruthy();

    fireEvent.press(getByTestId("home-profile-btn"));
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_profile");

    fireEvent.press(getByTestId("home-delivery-address-btn"));
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_saved_addresses");

    fireEvent.press(getByTestId("home-cart-btn"));
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_my_cart");
  });

  it("renders Today's Curations promotions and navigates on tap", async () => {
    const { getByText, getByTestId } = render(<SmagHomeNative />);

    await waitFor(() => {
      expect(getByText("30% Off Family Platters")).toBeTruthy();
    });

    const promoCard = getByTestId("hero-card-promo-1");
    fireEvent.press(promoCard);
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_promotions_deals");
  });

  it("renders all quick access links and navigates correctly", async () => {
    const { getByTestId } = render(<SmagHomeNative />);

    const quickTargets = [
      { id: "quick-link-explore", route: "/smag_explore" },
      { id: "quick-link-menu", route: "/smag_menu" },
      { id: "quick-link-rewards", route: "/smag_membership_rewards" },
      { id: "quick-link-orders", route: "/smag_order_history" },
      { id: "quick-link-profile", route: "/smag_profile" },
      { id: "quick-link-alerts", route: "/smag_notifications" }
    ];

    for (const item of quickTargets) {
      const link = getByTestId(item.id);
      fireEvent.press(link);
      expect(mockRouter.push).toHaveBeenCalledWith(item.route);
    }
  });

  it("searches Smag Kitchen dishes and displays dropdown results", async () => {
    const { getByTestId, getByText, queryByTestId } = render(<SmagHomeNative />);

    const searchInput = getByTestId("home-search-input");
    fireEvent(searchInput, "focus");
    fireEvent.changeText(searchInput, "Jollof");

    await waitFor(() => {
      expect(getByTestId("home-search-dropdown")).toBeTruthy();
      expect(getByText("Jollof Rice")).toBeTruthy();
    });

    // Clear search
    const clearBtn = getByTestId("home-search-clear");
    fireEvent.press(clearBtn);

    expect(queryByTestId("home-search-dropdown")).toBeNull();
  });

  it("navigates to Other Kitchens handoff when requested from search dropdown", async () => {
    const { getByTestId, getByText } = render(<SmagHomeNative />);

    const searchInput = getByTestId("home-search-input");
    fireEvent(searchInput, "focus");
    fireEvent.changeText(searchInput, "Sushi");

    await waitFor(() => {
      expect(getByTestId("home-search-other-kitchens")).toBeTruthy();
    });

    fireEvent.press(getByTestId("home-search-other-kitchens"));
    expect(mockRouter.push).toHaveBeenCalledWith("/other_kitchens?query=Sushi");
  });

  it("navigates to explore when search filter button is tapped", () => {
    const { getByTestId } = render(<SmagHomeNative />);

    const filterBtn = getByTestId("home-search-filter");
    fireEvent.press(filterBtn);
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_explore");
  });

  it("navigates to other kitchens from section header and banner", () => {
    const { getByTestId } = render(<SmagHomeNative />);

    const seeAllBtn = getByTestId("home-other-kitchens-see-all");
    fireEvent.press(seeAllBtn);
    expect(mockRouter.push).toHaveBeenCalledWith("/other_kitchens");

    const banner = getByTestId("home-other-kitchens-banner");
    fireEvent.press(banner);
    expect(mockRouter.push).toHaveBeenCalledWith("/other_kitchens");
  });
});
