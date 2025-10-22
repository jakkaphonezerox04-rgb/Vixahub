import { firestore } from './firebase';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, runTransaction, query, where, getDocs } from 'firebase/firestore';

interface UserCredits {
  userId: string;
  credits: number;
  lastUpdated: any;
}

interface CreditTransaction {
  userId: string;
  amount: number;
  type: 'topup' | 'spend' | 'refund';
  paymentId?: string;
  description: string;
  timestamp: any;
}

class FirebaseCreditsService {
  private usersCollection = 'users';
  private transactionsCollection = 'credit_transactions';

  /**
   * Get user credits from Firestore
   */
  async getUserCredits(userId: string): Promise<{ success: boolean; credits: number; error?: string }> {
    try {
      const userRef = doc(firestore, this.usersCollection, userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as UserCredits;
        return {
          success: true,
          credits: userData.credits || 0
        };
      } else {
        // Create new user with default credits
        const defaultCredits = 1250;
        await setDoc(userRef, {
          userId,
          credits: defaultCredits,
          lastUpdated: serverTimestamp()
        });
        
        console.log(`✅ Created user ${userId} with ${defaultCredits} credits`);
        return {
          success: true,
          credits: defaultCredits
        };
      }
    } catch (error) {
      console.error('Error getting user credits:', error);
      return {
        success: false,
        credits: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Add credits to user account using Firestore transaction
   */
  async addCredits(
    userId: string, 
    amount: number, 
    paymentId?: string, 
    description: string = 'Credit topup'
  ): Promise<{ success: boolean; newBalance: number; creditsAdded: number; error?: string }> {
    try {
      const userRef = doc(firestore, this.usersCollection, userId);
      
      // Use Firestore transaction to safely update credits
      const result = await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        let newBalance: number;
        
        if (!userDoc.exists()) {
          // Create new user with default credits + amount
          newBalance = 1250 + amount;
          transaction.set(userRef, {
            userId,
            credits: newBalance,
            lastUpdated: serverTimestamp()
          });
        } else {
          // Update existing user
          const currentCredits = userDoc.data().credits || 0;
          newBalance = currentCredits + amount;
          transaction.update(userRef, {
            credits: newBalance,
            lastUpdated: serverTimestamp()
          });
        }
        
        return newBalance;
      });

      // Log transaction
      const transactionData: CreditTransaction = {
        userId,
        amount,
        type: 'topup',
        paymentId,
        description,
        timestamp: serverTimestamp()
      };
      
      await addDoc(collection(firestore, this.transactionsCollection), transactionData);

      console.log(`✅ Added ${amount} credits to user ${userId}. New balance: ${result}`);

      return {
        success: true,
        newBalance: result,
        creditsAdded: amount
      };

    } catch (error) {
      console.error('Error adding credits:', error);
      return {
        success: false,
        newBalance: 0,
        creditsAdded: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Spend credits from user account using Firestore transaction
   */
  async spendCredits(
    userId: string, 
    amount: number, 
    description: string = 'Credit spent'
  ): Promise<{ success: boolean; newBalance: number; creditsSpent: number; error?: string }> {
    try {
      const userRef = doc(firestore, this.usersCollection, userId);
      
      // Use Firestore transaction to safely update credits
      const result = await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }
        
        const currentCredits = userDoc.data().credits || 0;
        
        if (currentCredits < amount) {
          throw new Error('Insufficient credits');
        }
        
        const newBalance = currentCredits - amount;
        
        transaction.update(userRef, {
          credits: newBalance,
          lastUpdated: serverTimestamp()
        });
        
        return newBalance;
      });

      // Log transaction
      const transactionData: CreditTransaction = {
        userId,
        amount: -amount,
        type: 'spend',
        description,
        timestamp: serverTimestamp()
      };
      
      await addDoc(collection(firestore, this.transactionsCollection), transactionData);

      console.log(`✅ Spent ${amount} credits from user ${userId}. New balance: ${result}`);

      return {
        success: true,
        newBalance: result,
        creditsSpent: amount
      };

    } catch (error) {
      console.error('Error spending credits:', error);
      return {
        success: false,
        newBalance: 0,
        creditsSpent: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user transaction history from Firestore
   */
  async getTransactionHistory(userId: string): Promise<{ success: boolean; transactions: any[]; error?: string }> {
    try {
      const transactionsRef = collection(firestore, this.transactionsCollection);
      const q = query(transactionsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      const transactions: any[] = [];
      querySnapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by timestamp descending
      transactions.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(0);
        const timeB = b.timestamp?.toDate?.() || new Date(0);
        return timeB.getTime() - timeA.getTime();
      });
      
      return {
        success: true,
        transactions
      };
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return {
        success: false,
        transactions: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const firebaseCreditsService = new FirebaseCreditsService();
export default FirebaseCreditsService; 