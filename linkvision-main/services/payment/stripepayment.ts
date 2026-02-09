import { collection, addDoc, onSnapshot, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";


export const createCheckoutSession = async (userId: string, userEmail?: string | null) => {
    try {
        // 1. Tenta buscar o cliente existente no Firestore para obter o stripeId
        const customerRef = doc(db, 'customers', userId);
        const customerSnap = await getDoc(customerRef);
        let existingStripeId = null;

        if (customerSnap.exists()) {
            const customerData = customerSnap.data();
            existingStripeId = customerData.stripeId || customerData.stripe_customer_id; // Verifica campos comuns
        }

        // Reference to the checkout_sessions subcollection for the specific customer
        const checkoutSessionsRef = collection(db, 'customers', userId, 'checkout_sessions');

        // Prepare the session data
        const sessionData: any = {
            // mode: 'subscription', // Uncomment if creating a subscription
            price: 'price_1SyggQJ99s1VqBxmCEkb8HaK',
            success_url: `${window.location.origin}/?payment_success=true`,
            cancel_url: `${window.location.origin}/?payment_canceled=true`,
            metadata: {
                firebaseUID: userId,
            },
        };

        // Se tivermos um ID de cliente existente, usamos ele para evitar duplicação
        if (existingStripeId) {
            sessionData.customer = existingStripeId;
        } else {
            // Caso contrário, passamos o e-mail para que a extensão tente criar ou encontrar
            sessionData.customer_email = userEmail;
        }

        // Add a new document to the collection
        const docRef = await addDoc(checkoutSessionsRef, sessionData);

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

/**
 * Activates the user account by setting status to 'active' in Firestore.
 * 
 * @param userId - The UID of the current user
 */
export const activateUserAccount = async (userId: string) => {
    try {
        console.log(`Tentando ativar conta para usuário: ${userId}`);
        const userRef = doc(db, 'customers', userId);
        await setDoc(userRef, {
            status: 'active',
            plan: 'premium',
            updatedAt: new Date(),
            stripePayment: true,
            payment: true,
            isPaid: true
        }, { merge: true });
        console.log("Conta ativada com sucesso no Firestore!");
        return true;
    } catch (error) {
        console.error("Erro ao ativar conta:", error);
        return false;
    }
};
