import { PaymentProcessor } from './processor';

let schedulerInterval: NodeJS.Timeout | null = null;

export function startScheduler(): void {
  if (schedulerInterval) {
    console.log('Scheduler already running');
    return;
  }

  const processor = new PaymentProcessor('testnet');
  
  schedulerInterval = setInterval(async () => {
    console.log('Checking for due payments...');
    
    const dueSubscriptions = await processor.checkDuePayments();
    
    if (dueSubscriptions.length > 0) {
      console.log(`Found ${dueSubscriptions.length} due payments`);
      
      for (const subscription of dueSubscriptions) {
        try {
          const result = await processor.processSubscriptionPayment(subscription.id);
          
          if (result.success) {
            console.log(`Processed payment for subscription ${subscription.id}`);
            processor.scheduleNextPayment(subscription.id);
          } else {
            console.error(`Failed to process payment for subscription ${subscription.id}:`, result.error);
          }
        } catch (error) {
          console.error(`Error processing payment for subscription ${subscription.id}:`, error);
        }
      }
    }
  }, 5 * 60 * 1000);

  console.log('Payment scheduler started');
}

export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('Payment scheduler stopped');
  }
}
