import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SmagExploreNative } from "@/screens/native/SmagExploreNative";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn()
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter
}));

const mockCurrentUser = { uid: "test-user-123" };
jest.mock("@/lib/firebase/auth", () => ({
  getCurrentUser: () => mockCurrentUser
}));

const mockAddToCart = jest.fn().mockResolvedValue(undefined);
const mockEnqueueCartMutation = jest.fn().mockResolvedValue(undefined);

const sampleExternalRestaurants = [
  {
    id: "ext-1",
    name: "Ocean Garden Seafood",
    cuisine: "Seafood, Grill",
    address: "12 Marina Road, VI",
    imageUrl: "https://example.com/ocean.jpg",
    rating: 4.8,
    deliveryMinutes: 30,
    deliveryFee: 0,
    isOpen: true
  },
  {
    id: "ext-2",
    name: "Luigi Trattoria",
    cuisine: "Italian, Pizza",
    address: "44 Adeola Odeku",
    imageUrl: "https://example.com/luigi.jpg",
    rating: 4.6,
    deliveryMinutes: 40,
    deliveryFee: 1500,
    isOpen: false
  }
];

const sampleMenuItems = [
  {
    id: "menu-ext-1",
    name: "Spicy Calamari",
    description: "Crispy calamari with chili dip",
    price: 9500,
    imageUrl: "https://example.com/calamari.jpg",
    category: "Appetizers",
    restaurantId: "ext-1",
    restaurantName: "Ocean Garden Seafood"
  }
];

jest.mock("@/lib/firebase/firestore", () => ({
  addToCart: (...args: unknown[]) => mockAddToCart(...args),
  subscribeMenuItems: (_restaurantId: string, cb: (items: unknown[]) => void) => {
    if (typeof cb === "function") cb(sampleMenuItems);
    return () => {};
  },
  subscribeExternalRestaurants: (cb: (restaurants: unknown[]) => void) => {
    if (typeof cb === "function") cb(sampleExternalRestaurants);
    return () => {};
  }
}));

let mockIsOnline = true;
jest.mock("@/lib/useNetworkStatus", () => ({
  useNetworkStatus: () => mockIsOnline
}));

jest.mock("@/lib/offlineQueue", () => ({
  enqueueCartMutation: (...args: unknown[]) => mockEnqueueCartMutation(...args)
}));

jest.mock("@/lib/userProfile", () => ({
  getUserProfile: () => Promise.resolve({
    fullName: "Chef Marco",
    avatarUri: "https://example.com/avatar.jpg"
  }),
  subscribeUserProfile: (cb: (p: unknown) => void) => {
    if (typeof cb === "function") {
      cb({
        fullName: "Chef Marco",
        avatarUri: "https://example.com/avatar.jpg"
      });
    }
    return () => {};
  }
}));

jest.mock("@/lib/haptics", () => ({
  haptics: {
    tap: jest.fn().mockResolvedValue(undefined),
    selection: jest.fn().mockResolvedValue(undefined),
    success: jest.fn().mockResolvedValue(undefined),
    error: jest.fn().mockResolvedValue(undefined)
  }
}));

describe("SmagExploreNative Screen", () => {
  beforeEach(() => {
    mockRouter.push.mockReset();
    mockAddToCart.mockReset();
    mockEnqueueCartMutation.mockReset();
    mockIsOnline = true;
  });

  it("renders top bar with Explore title, Settings button, and Profile avatar", async () => {
    const { getByTestId, getByText } = render(<SmagExploreNative />);

    await waitFor(() => {
      expect(getByText("Explore")).toBeTruthy();
    });

    expect(getByTestId("explore-settings-btn")).toBeTruthy();
    expect(getByTestId("explore-profile-btn")).toBeTruthy();

    fireEvent.press(getByTestId("explore-settings-btn"));
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_settings");

    fireEvent.press(getByTestId("explore-profile-btn"));
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_profile");
  });

  it("renders tabs and toggles between Smag Kitchen and Other Kitchens", async () => {
    const { getByTestId, getByText } = render(<SmagExploreNative />);

    await waitFor(() => {
      expect(getByTestId("explore-tab-smag")).toBeTruthy();
    });
    expect(getByTestId("explore-tab-other")).toBeTruthy();
    expect(getByText("Popular Categories")).toBeTruthy();

    // Switch to Other Kitchens tab
    fireEvent.press(getByTestId("explore-tab-other"));
    expect(getByText("Browse Full Directory")).toBeTruthy();
    expect(getByText("Partner Restaurants")).toBeTruthy();
    expect(getByText("Ocean Garden Seafood")).toBeTruthy();
    expect(getByText("Luigi Trattoria")).toBeTruthy();

    // Switch back to Smag Kitchen tab
    fireEvent.press(getByTestId("explore-tab-smag"));
    expect(getByText("Popular Categories")).toBeTruthy();
  });

  it("switches meal categories when tapped in Smag Kitchen tab", async () => {
    const { getByText } = render(<SmagExploreNative />);

    // Default category is Breakfast, dish like "Akara & Ogi" is visible
    await waitFor(() => {
      expect(getByText("Akara & Ogi")).toBeTruthy();
    });

    // Select "Lunch" category
    fireEvent.press(getByText("Lunch"));
    expect(getByText("Jollof Rice")).toBeTruthy();

    // Select "Dinner" category
    fireEvent.press(getByText("Dinner"));
    expect(getByText("Asun (Peppered Goat)")).toBeTruthy();
  });

  it("opens dish customization modal, configures options, changes quantity, and adds to cart", async () => {
    const { getByTestId, getByText, queryByTestId } = render(<SmagExploreNative />);

    await waitFor(() => {
      expect(getByTestId("dish-card-0")).toBeTruthy();
    });

    // Click on the first dish card to open modal
    fireEvent.press(getByTestId("dish-card-0"));

    // Modal should be visible with dish details
    expect(getByText("Customize it quickly")).toBeTruthy();
    expect(getByTestId("dish-modal-add-btn")).toBeTruthy();

    // Increase quantity to 2
    fireEvent.press(getByTestId("dish-modal-qty-increase"));
    expect(getByTestId("dish-modal-qty-text").props.children).toBe(2);

    // Tap Add to Cart
    fireEvent.press(getByTestId("dish-modal-add-btn"));

    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledWith(
        "test-user-123",
        expect.objectContaining({
          name: "Akara & Ogi",
          quantity: 2,
          restaurantId: "smag_kitchen",
          restaurantName: "Smag Kitchen"
        })
      );
      expect(mockRouter.push).toHaveBeenCalledWith("/smag_my_cart");
    });

    // Modal closes after adding
    expect(queryByTestId("dish-modal-add-btn")).toBeNull();
  });

  it("enqueues cart mutation when adding a dish while offline", async () => {
    mockIsOnline = false;
    const { getByTestId, getByText } = render(<SmagExploreNative />);

    await waitFor(() => {
      expect(getByTestId("dish-card-0")).toBeTruthy();
    });

    fireEvent.press(getByTestId("dish-card-0"));
    expect(getByText("Customize it quickly")).toBeTruthy();

    fireEvent.press(getByTestId("dish-modal-add-btn"));

    await waitFor(
      () => {
        expect(mockEnqueueCartMutation).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "add",
            userId: "test-user-123",
            item: expect.objectContaining({
              name: "Akara & Ogi",
              quantity: 1
            })
          })
        );
        expect(mockAddToCart).not.toHaveBeenCalled();
      },
      { timeout: 5000 }
    );
  });

  it("adds trending items directly to cart when tapping the + button", async () => {
    const { getByTestId } = render(<SmagExploreNative />);

    await waitFor(() => {
      expect(getByTestId("add-trending-0")).toBeTruthy();
    });

    // First trending item is Wild Salmon Poke Bowl
    const addTrending0 = getByTestId("add-trending-0");
    fireEvent.press(addTrending0);

    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledWith(
        "test-user-123",
        expect.objectContaining({
          name: "Wild Salmon Poke Bowl",
          quantity: 1,
          restaurantId: "ocean_garden"
        })
      );
      expect(mockRouter.push).toHaveBeenCalledWith("/smag_my_cart");
    });
  });

  it("navigates to curated collections when tapped", async () => {
    const { getByText } = render(<SmagExploreNative />);

    await waitFor(() => {
      expect(getByText("Sweet Treats")).toBeTruthy();
    });

    fireEvent.press(getByText("Sweet Treats"));
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_menu");

    fireEvent.press(getByText("Vegan Feast"));
    expect(mockRouter.push).toHaveBeenCalledWith("/smag_menu");
  });

  it("filters dishes with search query and handles clear button", async () => {
    const { getByTestId, getByText, queryByText } = render(<SmagExploreNative />);

    await waitFor(() => {
      expect(getByTestId("explore-search-input")).toBeTruthy();
    });

    const searchInput = getByTestId("explore-search-input");
    fireEvent.changeText(searchInput, "Jollof");

    expect(getByText(/result.*for "Jollof"/i)).toBeTruthy();
    expect(getByText("Jollof Rice")).toBeTruthy();

    // Clear search
    const clearBtn = getByTestId("explore-search-clear");
    fireEvent.press(clearBtn);

    expect(queryByText(/result.*for "Jollof"/i)).toBeNull();
    expect(getByText("Popular Categories")).toBeTruthy();
  });

  it("searches and navigates to partner kitchen in Other Kitchens tab", async () => {
    const { getByTestId, getByText, queryByText } = render(<SmagExploreNative />);

    await waitFor(() => {
      expect(getByTestId("explore-tab-other")).toBeTruthy();
    });

    // Switch to Other Kitchens tab
    fireEvent.press(getByTestId("explore-tab-other"));

    // Both restaurants visible initially
    expect(getByText("Ocean Garden Seafood")).toBeTruthy();
    expect(getByText("Luigi Trattoria")).toBeTruthy();

    // Filter for Italian
    const otherSearch = getByTestId("explore-other-search-input");
    fireEvent.changeText(otherSearch, "Italian");

    expect(queryByText("Ocean Garden Seafood")).toBeNull();
    expect(getByText("Luigi Trattoria")).toBeTruthy();

    // Tap on Luigi Trattoria card
    fireEvent.press(getByTestId("partner-restaurant-ext-2"));
    expect(mockRouter.push).toHaveBeenCalledWith("/other_kitchen_details?restaurantId=ext-2");
  });
});
