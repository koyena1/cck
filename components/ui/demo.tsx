'use client'

import { Card } from '@/components/ui/card'
import { Spotlight } from '@/components/ui/spotlight'
import { SplineScene } from '@/components/ui/splite'
import {
  BadgeDollarSign,
  Clock3,
  Layers3,
  ShieldCheck,
  ThumbsUp,
  Users,
} from 'lucide-react'

export function SplineSceneBasic() {
  const features = [
    {
      icon: Clock3,
      title: '24/7/365 Support',
      description: 'Dedicated assistance anytime for installation, service, and urgent troubleshooting.',
    },
    {
      icon: ShieldCheck,
      title: 'Trustworthy',
      description: 'Verified process, transparent communication, and dependable service execution.',
    },
    {
      icon: BadgeDollarSign,
      title: 'Affordable Rates',
      description: 'Competitive pricing with clear scope and no hidden service surprises.',
    },
    {
      icon: ThumbsUp,
      title: 'Reliable and Proven',
      description: 'Consistent delivery quality backed by practical field experience.',
    },
    {
      icon: Layers3,
      title: 'Different Range',
      description: 'From basic setups to advanced security solutions for varied needs.',
    },
    {
      icon: Users,
      title: 'Experts and Staff',
      description: 'Skilled technicians and support teams focused on quick resolution.',
    },
  ]

  return (
    <Card className="relative h-auto w-full overflow-hidden border-0 bg-red-950 shadow-2xl md:h-125">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

      <div className="relative z-10 flex h-full flex-col-reverse md:flex-row">
        <div className="flex flex-1 flex-col justify-center p-6 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200/80">Service Advantage</p>
          <h2 className="mt-2 bg-linear-to-b from-neutral-50 to-neutral-300 bg-clip-text text-3xl font-extrabold text-transparent md:text-5xl">
            Why Choose Us
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-200/90 md:text-base">
            Professional security service with fast response, verified handling, and dependable on-ground execution.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-white/15 bg-white/8 p-3 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg border border-red-200/40 bg-red-300/10 p-2">
                    <feature.icon className="h-4 w-4 text-red-100" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-200/85">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-72 w-full shrink-0 md:h-full md:flex-1">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="h-full w-full"
          />
        </div>
      </div>
    </Card>
  )
}
