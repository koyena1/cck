"use client";
import React, { useRef, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

const FoVVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(90);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 150;

    // Draw Room Walls (Simplified)
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Draw FOV Cone
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    const startAngle = (rotation - angle / 2 - 90) * (Math.PI / 180);
    const endAngle = (rotation + angle / 2 - 90) * (Math.PI / 180);
    
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.lineTo(centerX, centerY);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.stroke();

    // Draw Camera Icon
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();
  }, [angle, rotation]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Virtual Coverage Visualizer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-slate-50 rounded-lg flex justify-center p-4 border">
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={300} 
            className="max-w-full h-auto"
          />
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Lens Angle (FoV): {angle}°</label>
              <span className="text-xs text-muted-foreground">Typical: 2.8mm = 105°</span>
            </div>
            <Slider 
              value={[angle]} 
              min={30} max={120} step={1} 
              onValueChange={(val) => setAngle(val[0])} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Camera Direction</label>
            <Slider 
              value={[rotation]} 
              min={0} max={360} step={1} 
              onValueChange={(val) => setRotation(val[0])} 
            />
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground italic">
          Tip: Drag the sliders to see how lens size affects blind spots.
        </p>
      </CardContent>
    </Card>
  );
};

export default FoVVisualizer;