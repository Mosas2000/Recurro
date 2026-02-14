'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CreatePlanModalProps {
  creatorAddress: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePlanModal({ creatorAddress, onClose, onSuccess }: CreatePlanModalProps) {
  const [planName, setPlanName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'sBTC' | 'STX'>('sBTC');
  const [interval, setInterval] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!planName || !amount || parseFloat(amount) <= 0) {
      alert('Please fill in all fields with valid values');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorAddress,
          subscriberAddress: 'placeholder',
          amount: parseFloat(amount),
          currency,
          interval,
          planName,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        alert('Failed to create plan');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('Failed to create plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Subscription Plan</CardTitle>
          <CardDescription>
            Set up a new recurring payment plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Plan Name</label>
              <Input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Basic Plan"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                step="0.0001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0001"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'sBTC' | 'STX')}
                className="w-full p-2 border rounded-md"
              >
                <option value="sBTC">sBTC</option>
                <option value="STX">STX</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Interval</label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value as 'monthly' | 'weekly' | 'daily')}
                className="w-full p-2 border rounded-md"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Creating...' : 'Create Plan'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
