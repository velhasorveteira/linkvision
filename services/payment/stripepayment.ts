import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Creates a Stripe Checkout session for the current user.
 * This function uses the Firebase Stripe extension logic.
 * 
 * @param userId - The UID of the current user
 */
export const createCheckoutSession = async (userId: string) => {
    try {
        // Reference to the checkout_sessions subcollection for the specific customer
        const checkoutSessionsRef = collection(db, 'customers', userId, 'checkout_sessions');

        // Add a new document to the collection
        const docRef = await addDoc(checkoutSessionsRef, {
            price: 'prod_TvhpyFbcmuMcga', // Using the Stripe Product ID provided
            success_url: window.location.origin,
            cancel_url: window.location.origin,
        });

        // Wait for the CheckoutSession to get attached by the extension
        onSnapshot(docRef, (snap) => {
            const data = snap.data();
            if (data) {
                const { error, url } = data;
                if (error) {
                    // Show an error to your customer
                    alert(`An error occurred: ${error.message}`);
                }
                if (url) {
                    // We have a Stripe Checkout URL, let's redirect.
                    window.location.assign(url);
                }
            }
        });
    } catch (error: any) {
        console.error("Error creating checkout session:", error);
        alert(`Error: ${error.message}`);
    }
};
