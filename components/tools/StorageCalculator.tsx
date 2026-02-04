"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const StorageCalculator = () => {
  const [cameras, setCameras] = useState(4);
  const [days, setDays] = useState(30);
  const [resolution, setResolution] = useState("4"); // MP
  const [compression, setCompression] = useState("h265+");
  const [result, setResult] = useState(0);

  // Bitrate mapping (average Mbps per camera at 15fps)
  const bitrateMap: Record<string, Record<string, number>> = {
    "2": { h264: 4, h265: 2, "h265+": 1 },
    "4": { h264: 8, h265: 4, "h265+": 2 },
    "8": { h264: 16, h265: 8, "h265+": 4 },
  };

  useEffect(() => {
    const bitrate = bitrateMap[resolution][compression] || 2;
    // Formula: (Bitrate in Mbps * 3600 seconds * 24 hours * Days * Cameras) / (8 bits / 1024 / 1024 to get TB)
    const totalStorage = (bitrate * 3600 * 24 * days * cameras) / (8 * 1024 * 1024);
    setResult(parseFloat(totalStorage.toFixed(2)));
  }, [cameras, days, resolution, compression]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold">HDD Storage Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Number of Cameras</Label>
            <Input type="number" value={cameras} onChange={(e) => setCameras(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Days of Recording</Label>
            <Input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Resolution</Label>
          <Select onValueChange={setResolution} defaultValue={resolution}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2MP (1080p)</SelectItem>
              <SelectItem value="4">4MP (2K)</SelectItem>
              <SelectItem value="8">8MP (4K Ultra HD)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Compression Technology</Label>
          <Select onValueChange={setCompression} defaultValue={compression}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="h264">H.264 (Standard)</SelectItem>
              <SelectItem value="h265">H.265 (High Efficiency)</SelectItem>
              <SelectItem value="h265+">H.265+ (Ultra Savings)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 p-4 bg-primary/10 rounded-lg text-center">
          <p className="text-sm font-medium text-muted-foreground">Recommended HDD Size</p>
          <p className="text-3xl font-bold text-primary">{result} TB</p>
          <p className="text-xs text-muted-foreground mt-2">*Estimates based on standard scene motion</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageCalculator;