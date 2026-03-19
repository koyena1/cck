"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Mail,
  Send,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface SendAlertModalProps {
  dealerId: number | null;
  dealerName: string;
  dealerEmail: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SendAlertModal({ 
  dealerId, 
  dealerName,
  dealerEmail,
  isOpen, 
  onClose,
  onSuccess 
}: SendAlertModalProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('alert');
  const [priority, setPriority] = useState('normal');
  const [sendEmail, setSendEmail] = useState(true);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dealerId || !title.trim() || !message.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSending(true);

    try {
      const response = await fetch(`/api/dealers/${dealerId}/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          type,
          priority,
          sendEmail
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message || 'Alert sent successfully!');
        // Reset form
        setTitle('');
        setMessage('');
        setType('alert');
        setPriority('normal');
        setSendEmail(true);
        onSuccess();
        onClose();
      } else {
        alert(`Failed to send alert: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending alert:', error);
      alert('Failed to send alert. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Predefined templates
  const applyTemplate = (templateType: string) => {
    switch (templateType) {
      case 'stock-update':
        setTitle('Stock Update Required');
        setMessage(`Dear ${dealerName},\n\nWe noticed that your stock inventory hasn't been updated recently. Please log in to your dealer portal and update your current stock levels to ensure accurate order allocation.\n\nThis will help us serve customers better and ensure you receive relevant orders.\n\nThank you for your cooperation.`);
        setType('warning');
        setPriority('high');
        break;
      case 'urgent-stock':
        setTitle('⚠️ URGENT: Stock Update Required');
        setMessage(`Dear ${dealerName},\n\nYour stock has not been updated for more than 10 days. This may affect your ability to receive new orders.\n\nPlease update your inventory immediately to continue receiving orders.\n\nIf you need any assistance, please contact our support team.`);
        setType('alert');
        setPriority('urgent');
        break;
      case 'general':
        setTitle('Important Notice');
        setMessage(`Dear ${dealerName},\n\n[Your message here]\n\nBest regards,\nAdmin Team`);
        setType('info');
        setPriority('normal');
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Mail className="w-6 h-6 text-[#facc15]" />
            Send Alert to Dealer
          </DialogTitle>
          <DialogDescription className="pt-2">
            Send a notification to <span className="font-bold">{dealerName}</span> ({dealerEmail})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Templates */}
          <div className="space-y-2">
            <Label>Quick Templates</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate('stock-update')}
              >
                Stock Update Reminder
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate('urgent-stock')}
              >
                Urgent Stock Alert
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate('general')}
              >
                General Notice
              </Button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Alert Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter alert title"
              required
              className="font-semibold"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              required
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-slate-500">{message.length} characters</p>
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Alert Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">ℹ️ Info</SelectItem>
                  <SelectItem value="warning">⚠️ Warning</SelectItem>
                  <SelectItem value="alert">🔴 Alert</SelectItem>
                  <SelectItem value="success">✅ Success</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Send Email Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendEmail"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(checked as boolean)}
            />
            <Label 
              htmlFor="sendEmail"
              className="text-sm font-normal cursor-pointer"
            >
              Also send this alert via email to {dealerEmail}
            </Label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={sending}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sending || !title.trim() || !message.trim()}
              className="flex-1 bg-[#facc15] hover:bg-yellow-500 text-[#0f172a]"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Alert
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
