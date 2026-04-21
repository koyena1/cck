'use client'

import { Suspense, useEffect, useState } from 'react'
import { PlusCircle, Wrench, ShieldCheck, Settings2 } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

type ServiceCategory = 'Installations' | 'AMC' | 'Services'

export default function ServicesPage() {
  const [showCategories, setShowCategories] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null)

  const [customerName, setCustomerName] = useState('Service Request Customer')
  const [customerEmail, setCustomerEmail] = useState('')

  const [installationType, setInstallationType] = useState('')
  const [registeredMobileOrOrderId, setRegisteredMobileOrOrderId] = useState('')
  const [installationDescription, setInstallationDescription] = useState('')

  const [othersLocation, setOthersLocation] = useState('')
  const [othersMobile, setOthersMobile] = useState('')
  const [othersDescription, setOthersDescription] = useState('')

  const [amcType, setAmcType] = useState('')
  const [amcDetails, setAmcDetails] = useState('')

  const [serviceMobile, setServiceMobile] = useState('')
  const [serviceDetails, setServiceDetails] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const storedName = localStorage.getItem('customerName')
    const storedEmail = localStorage.getItem('customerEmail')

    if (storedName?.trim()) {
      setCustomerName(storedName.trim())
    }
    if (storedEmail?.trim()) {
      setCustomerEmail(storedEmail.trim())
    }
  }, [])

  const resetCurrentForm = () => {
    setInstallationType('')
    setRegisteredMobileOrOrderId('')
    setInstallationDescription('')
    setOthersLocation('')
    setOthersMobile('')
    setOthersDescription('')
    setAmcType('')
    setAmcDetails('')
    setServiceMobile('')
    setServiceDetails('')
  }

  const onCategorySelect = (category: ServiceCategory) => {
    setSelectedCategory(category)
    setErrorMessage('')
    setSuccessMessage('')
    resetCurrentForm()
  }

  const submitRequest = async () => {
    if (!selectedCategory) {
      setErrorMessage('Please choose a category first.')
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    let payload: any = {
      customerName,
      customerEmail: customerEmail || null,
      ticketSource: 'services_portal',
      category: selectedCategory,
      subCategory: '',
      explanation: '',
      customerPhone: null,
      location: null,
      referenceOrderId: null,
      referenceOrderNumber: null,
    }

    if (selectedCategory === 'Installations') {
      if (!installationType) {
        setErrorMessage('Please select Installation type.')
        return
      }

      if (installationType === 'Purchase from Protechtur') {
        if (!registeredMobileOrOrderId.trim() || !installationDescription.trim()) {
          setErrorMessage('Please enter Registered Mobile Number / Order ID and description.')
          return
        }

        const rawRef = registeredMobileOrOrderId.trim()
        const digitsOnly = rawRef.replace(/\D/g, '')

        if (/^\d+$/.test(rawRef) && rawRef.length <= 8) {
          payload.referenceOrderId = Number(rawRef)
        } else {
          payload.referenceOrderNumber = rawRef
        }

        if (digitsOnly.length >= 10) {
          payload.customerPhone = digitsOnly.slice(-10)
        }

        payload.subCategory = 'Purchase from Protechtur'
        payload.explanation = installationDescription.trim()
      } else {
        if (!othersLocation.trim() || !othersMobile.trim() || !othersDescription.trim()) {
          setErrorMessage('Please enter location, mobile number, and issue details.')
          return
        }

        payload.subCategory = 'Purchase from Others'
        payload.customerPhone = othersMobile.trim()
        payload.location = othersLocation.trim()
        payload.explanation = othersDescription.trim()
      }
    }

    if (selectedCategory === 'AMC') {
      if (!amcType) {
        setErrorMessage('Please select AMC type.')
        return
      }

      payload.subCategory = amcType
      payload.explanation = amcDetails.trim() || `AMC request raised under ${amcType}.`
    }

    if (selectedCategory === 'Services') {
      if (!serviceMobile.trim() || !serviceDetails.trim()) {
        setErrorMessage('Please enter mobile number and service details.')
        return
      }

      payload.subCategory = 'General Service Request'
      payload.customerPhone = serviceMobile.trim()
      payload.explanation = serviceDetails.trim()
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit service request')
      }

      setSuccessMessage(`Request submitted successfully. Ticket: ${data.ticket?.ticket_number || 'Created'}`)
      setErrorMessage('')
      resetCurrentForm()
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to submit request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_20%,#fee2e2_0%,#fff1f2_22%,#f8fafc_60%,#ffffff_100%)]">
      <Suspense fallback={<div className="h-16" />}>
        <Navbar />
      </Suspense>

      <main className="px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <section className="overflow-hidden rounded-[28px] border border-rose-100 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="border-b border-rose-100 bg-linear-to-r from-rose-50 via-orange-50 to-slate-50 px-6 py-7 sm:px-10">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-500">Service Request Desk</p>
              <h1 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">Create Your Services</h1>
              <p className="mt-2 text-sm text-slate-600">
                Submit service requests directly to BPO Portal, Admin Panel, and District Manager workflow.
              </p>
            </div>

            <div className="space-y-6 p-6 sm:p-10">
              <button
                type="button"
                onClick={() => setShowCategories((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left transition hover:border-rose-300 hover:bg-rose-50"
              >
                <div className="flex items-center gap-3">
                  <PlusCircle className="h-7 w-7 text-rose-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Create Your Services</p>
                    <p className="text-xs text-slate-500">Click to view Installations, AMC, and Services</p>
                  </div>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {showCategories ? 'Hide' : 'Show'}
                </span>
              </button>

              {showCategories && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => onCategorySelect('Installations')}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      selectedCategory === 'Installations'
                        ? 'border-rose-400 bg-rose-50'
                        : 'border-slate-200 bg-white hover:border-rose-200'
                    }`}
                  >
                    <Wrench className="mb-2 h-5 w-5 text-rose-500" />
                    <p className="text-sm font-bold text-slate-900">Installations</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCategorySelect('AMC')}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      selectedCategory === 'AMC'
                        ? 'border-rose-400 bg-rose-50'
                        : 'border-slate-200 bg-white hover:border-rose-200'
                    }`}
                  >
                    <ShieldCheck className="mb-2 h-5 w-5 text-rose-500" />
                    <p className="text-sm font-bold text-slate-900">AMC</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCategorySelect('Services')}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      selectedCategory === 'Services'
                        ? 'border-rose-400 bg-rose-50'
                        : 'border-slate-200 bg-white hover:border-rose-200'
                    }`}
                  >
                    <Settings2 className="mb-2 h-5 w-5 text-rose-500" />
                    <p className="text-sm font-bold text-slate-900">Services</p>
                  </button>
                </div>
              )}

              {selectedCategory === 'Installations' && (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <h2 className="text-lg font-black text-slate-900">Installations</h2>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Purchase Type</label>
                    <select
                      value={installationType}
                      onChange={(event) => setInstallationType(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Select</option>
                      <option value="Purchase from Protechtur">Purchase from Protechtur</option>
                      <option value="Purchase from Others">Purchase from Others</option>
                    </select>
                  </div>

                  {installationType === 'Purchase from Protechtur' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Registered Mobile Number / Order ID</label>
                        <input
                          value={registeredMobileOrOrderId}
                          onChange={(event) => setRegisteredMobileOrOrderId(event.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                          placeholder="Enter registered mobile or order id"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Description of Service Required</label>
                        <textarea
                          value={installationDescription}
                          onChange={(event) => setInstallationDescription(event.target.value)}
                          className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                          placeholder="Describe the service requirement"
                        />
                      </div>
                    </>
                  )}

                  {installationType === 'Purchase from Others' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Location</label>
                        <input
                          value={othersLocation}
                          onChange={(event) => setOthersLocation(event.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                          placeholder="District / area / pincode"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Mobile Number</label>
                        <input
                          value={othersMobile}
                          onChange={(event) => setOthersMobile(event.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                          placeholder="Enter mobile number"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Description of Service/Issue (All Details)</label>
                        <textarea
                          value={othersDescription}
                          onChange={(event) => setOthersDescription(event.target.value)}
                          className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                          placeholder="Describe the issue in detail"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {selectedCategory === 'AMC' && (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <h2 className="text-lg font-black text-slate-900">AMC</h2>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">AMC Type</label>
                    <select
                      value={amcType}
                      onChange={(event) => setAmcType(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Select</option>
                      <option value="Comprehensive">Comprehensive</option>
                      <option value="Non-Comprehensive">Non-Comprehensive</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Service Details (Optional)</label>
                    <textarea
                      value={amcDetails}
                      onChange={(event) => setAmcDetails(event.target.value)}
                      className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      placeholder="Add any details if available"
                    />
                  </div>
                </div>
              )}

              {selectedCategory === 'Services' && (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <h2 className="text-lg font-black text-slate-900">Services</h2>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Mobile Number</label>
                    <input
                      value={serviceMobile}
                      onChange={(event) => setServiceMobile(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      placeholder="Enter mobile number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Service Details / Issue Description</label>
                    <textarea
                      value={serviceDetails}
                      onChange={(event) => setServiceDetails(event.target.value)}
                      className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      placeholder="Describe your issue"
                    />
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {successMessage}
                </div>
              )}

              {selectedCategory && (
                <button
                  type="button"
                  onClick={submitRequest}
                  disabled={submitting}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-[#e63946] px-8 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}