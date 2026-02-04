import StorageCalculator from "@/components/tools/StorageCalculator";
import SecurityQuiz from "@/components/tools/SecurityQuiz";
import FoVVisualizer from "@/components/tools/FoVVisualizer";

export default function ToolsPage() {
  return (
    <div className="container py-10 space-y-20">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Smart Planning Tools</h1>
        <p className="text-xl text-muted-foreground">Expert tools to help you design the perfect security system.</p>
      </section>

      <div className="grid lg:grid-cols-2 gap-10 items-start">
        <SecurityQuiz />
        <StorageCalculator />
      </div>

      <div className="border-t pt-20">
        <h2 className="text-3xl font-bold text-center mb-10">Coverage Visualizer</h2>
        <FoVVisualizer />
      </div>
    </div>
  );
}