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
  const [description, setDescription] = useState('');
  const [perks, setPerks] = useState<string[]>(['']);
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
          description,
          perks: perks.filter((p) => p.trim() !== ''),
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                placeholder="Pro Plan"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what subscribers will get with this plan..."
                className="w-full p-2 border rounded-md text-sm min-h-[80px] resize-y bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium">What&apos;s Included</label>
              <p className="text-xs text-muted-foreground mb-2">List the perks subscribers will receive</p>
              <div className="space-y-2">
                {perks.map((perk, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="text"
                      value={perk}
                      onChange={(e) => {
                        const updated = [...perks];
                        updated[index] = e.target.value;
                        setPerks(updated);
                      }}
                      placeholder={`Perk ${index + 1}, e.g. "Exclusive content access"`}
                    />
                    {perks.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPerks(perks.filter((_, i) => i !== index))}
                        className="shrink-0 text-red-500 hover:text-red-700"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPerks([...perks, ''])}
                  className="w-full"
                >
                  + Add Perk
                </Button>
              </div>
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
