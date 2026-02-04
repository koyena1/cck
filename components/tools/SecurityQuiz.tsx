"use client";
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, RotateCcw } from "lucide-react";

const SecurityQuiz = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const questions = [
    {
      id: "location",
      text: "Where will the cameras be installed?",
      options: ["Indoor Only", "Outdoor Only", "Mix of Both"]
    },
    {
      id: "night",
      text: "Is night-time color vision a priority?",
      options: ["Yes (Color at night)", "No (Black & White is fine)"]
    },
    {
      id: "usage",
      text: "What is the primary goal?",
      options: ["General Surveillance", "Face Recognition", "License Plate Reading"]
    }
  ];

  const handleAnswer = (option: string) => {
    setAnswers({ ...answers, [questions[step].id]: option });
    setStep(step + 1);
  };

  const getRecommendation = () => {
    if (answers.usage === "License Plate Reading") return "Hikvision 8MP 4K DarkFighter Series";
    if (answers.night === "Yes (Color at night)") return "Hikvision ColorVu Technology Kit";
    return "Hikvision 4MP Smart IP Value Series";
  };

  return (
    <Card className="w-full max-w-xl mx-auto overflow-hidden">
      <CardContent className="p-6">
        {step < questions.length ? (
          <div className="space-y-6">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {step + 1} of {questions.length}</span>
              <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all" 
                  style={{ width: `${((step + 1) / questions.length) * 100}%` }} 
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold">{questions[step].text}</h2>
            <div className="grid gap-3">
              {questions[step].options.map((opt) => (
                <Button 
                  key={opt} 
                  variant="outline" 
                  className="h-14 text-lg justify-between hover:bg-primary hover:text-white"
                  onClick={() => handleAnswer(opt)}
                >
                  {opt} <ArrowRight className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6 py-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Perfect Solution Found!</h2>
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-muted-foreground text-sm uppercase tracking-wider">Recommended Setup</p>
              <p className="text-xl font-bold mt-1">{getRecommendation()}</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setStep(0)} variant="ghost">
                <RotateCcw className="w-4 h-4 mr-2" /> Start Over
              </Button>
              <Button>View Pricing & Details</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityQuiz;