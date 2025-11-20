"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Copy, Image as ImageIcon, MessageCircle, Rocket, Twitter } from "lucide-react";
import { useState } from "react";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketTitle?: string;
  verdict?: string;
  confidence?: number;
}

export default function ShareModal({ open, onOpenChange, marketTitle, verdict, confidence }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("x");

  const shareUrl = `https://Polysentience.ai?via=share&r=${Math.random().toString(36).substr(2, 9)}`;

  const xText = `I ran this prediction market through Polysentience. Verdict: ${verdict === "YES" ? "✅" : "❌"} ${verdict} (${confidence}% confidence).

AI-powered deep research + analyst-grade report in 5s. Try it: ${shareUrl}`;

  const redditTitle = `AI verdict on "${marketTitle}": ${verdict === "YES" ? "✅" : "❌"} ${verdict} (report inside)`;
  const redditBody = `Just analyzed this prediction market on Polysentience and got a ${confidence}% confidence ${verdict} verdict.

The AI analyzed 40+ sources and provided a detailed breakdown with citations. Works with Polymarket and Kalshi.

Check it out: ${shareUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareX = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}`;
    window.open(tweetUrl, "_blank");
  };

  const handleShareReddit = () => {
    const redditUrl = `https://www.reddit.com/submit?title=${encodeURIComponent(redditTitle)}&text=${encodeURIComponent(redditBody)}`;
    window.open(redditUrl, "_blank");
  };

  const handleExportImage = () => {
    // In production, this would generate an image server-side
    alert("Image export would generate a share card with the verdict");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            Make this go <Rocket className="h-5 w-5" aria-hidden="true" />
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="x">X</TabsTrigger>
            <TabsTrigger value="reddit">Reddit</TabsTrigger>
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
          </TabsList>

          <TabsContent value="x" className="space-y-4">
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4">
              <p className="text-sm whitespace-pre-wrap">{xText}</p>
            </div>
            <Button onClick={handleShareX} className="w-full bg-white text-black hover:bg-neutral-800">
              <Twitter className="h-4 w-4 mr-2" />
              Post to X
            </Button>
          </TabsContent>

          <TabsContent value="reddit" className="space-y-4">
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-sm">Title:</p>
              <p className="text-sm">{redditTitle}</p>
              <p className="font-semibold text-sm mt-3">Body:</p>
              <p className="text-sm whitespace-pre-wrap">{redditBody}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleShareReddit()}
                variant="outline"
                className="flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                r/Polymarket
              </Button>
              <Button
                onClick={() => {
                  const url = `https://www.reddit.com/r/CryptoMarkets/submit?title=${encodeURIComponent(redditTitle)}&text=${encodeURIComponent(redditBody)}`;
                  window.open(url, "_blank");
                }}
                variant="outline"
                className="flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                r/CryptoMarkets
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button onClick={handleCopyLink} variant="outline">
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              This link includes your referral code for free credits
            </p>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-800 dark:to-neutral-900 rounded-lg p-8 text-black text-center space-y-4">
              <div className="text-4xl font-bold">
                Verdict: {verdict === "YES" ? "✅ YES" : "❌ NO"}
              </div>
              <div className="text-2xl">
                Confidence: {confidence}%
              </div>
              <div className="text-sm opacity-80">
                Polysentience.ai
              </div>
            </div>
            <Button onClick={handleExportImage} className="w-full">
              <ImageIcon className="h-4 w-4 mr-2" aria-hidden="true" />
              Export Share Card
            </Button>
          </TabsContent>
        </Tabs>

        <div className="bg-white dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
          <p className="text-sm text-green-800 dark:text-green-200">
            Share & get 1 free analysis (auto-applied)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}