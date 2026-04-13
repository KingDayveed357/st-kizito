"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button-custom"
import { Input } from "@/components/ui/input-custom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card-custom"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"
import { createClient } from "@/lib/supabase"

export default function PaymentDetailsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    bank_name: "",
    account_name: "",
    account_number: "",
  })

  const supabase = createClient()

  useEffect(() => {
    fetchPaymentDetails()
  }, [])

  const fetchPaymentDetails = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('parish_payment_details')
      .select('*')
      .limit(1)
      .single()

    if (!error && data) {
      setDetailId(data.id)
      setFormData({
        bank_name: data.bank_name,
        account_name: data.account_name,
        account_number: data.account_number,
      })
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!formData.bank_name || !formData.account_name || !formData.account_number) {
      setErrorMsg("Please fill in all fields")
      return
    }

    setIsSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      if (detailId) {
        const { error } = await supabase
          .from('parish_payment_details')
          .update({
            bank_name: formData.bank_name,
            account_name: formData.account_name,
            account_number: formData.account_number,
            last_updated: new Date().toISOString()
          })
          .eq('id', detailId)

        if (error) throw error
        setSuccessMsg("Payment details updated successfully")
      } else {
        const { data, error } = await supabase
          .from('parish_payment_details')
          .insert({
            bank_name: formData.bank_name,
            account_name: formData.account_name,
            account_number: formData.account_number,
          })
          .select()
          .single()

        if (error) throw error
        if (data) setDetailId(data.id)
        setSuccessMsg("Payment details created successfully")
      }
    } catch (e: any) {
      setErrorMsg("Error saving details: " + e.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdminLayout
      title="Parish Payment Details"
      subtitle="Manage the bank account details shown to parishioners for donations and bookings"
    >
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Bank Account Information</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              These details will be displayed to parishioners when they choose to pay via bank transfer.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {successMsg && (
              <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success font-medium">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
                {errorMsg}
              </div>
            )}

            {isLoading ? (
              <AdminPageSkeleton rows={1} />
            ) : (
              <>
                <Input
                  label="Bank Name"
                  placeholder="e.g., First Bank of Nigeria"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                />

                <Input
                  label="Account Name"
                  placeholder="e.g., St. Kizito Catholic Church"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                />

                <Input
                  label="Account Number"
                  placeholder="e.g., 1234567890"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                />

                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full md:w-auto"
                >
                  {isSaving ? "Saving..." : "Save Details"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
