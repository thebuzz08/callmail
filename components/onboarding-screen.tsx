"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Mail, Phone, CheckCircle2, Users, Globe, Search, Moon, Bell } from "lucide-react"

interface OnboardingScreenProps {
  onNext: () => void
}

export function OnboardingScreen({ onNext }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [contactAdded, setContactAdded] = useState(false)
  const [twilioNumber, setTwilioNumber] = useState("+1234567890")

  const totalSlides = 7

  useEffect(() => {
    fetch("/api/get-twilio-number")
      .then((res) => res.json())
      .then((data) => {
        if (data.phoneNumber) {
          setTwilioNumber(data.phoneNumber)
        }
      })
      .catch(() => {})
  }, [])

  const downloadContactCard = async () => {
    try {
      const response = await fetch("/images/callmail-contact-photo.jpg")
      const blob = await response.blob()
      const reader = new FileReader()

      reader.onloadend = () => {
        const base64data = reader.result as string
        const base64Image = base64data.split(",")[1]

        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Important Email...
TEL;TYPE=CELL:${twilioNumber}
PHOTO;ENCODING=b;TYPE=JPEG:${base64Image}
NOTE:CallMail - Important email alerts
END:VCARD`

        const vcardBlob = new Blob([vcard], { type: "text/vcard" })
        const url = URL.createObjectURL(vcardBlob)
        const a = document.createElement("a")
        a.href = url
        a.download = "CallMail.vcf"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setContactAdded(true)
      }

      reader.readAsDataURL(blob)
    } catch {
      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Important Email...
TEL;TYPE=CELL:${twilioNumber}
NOTE:CallMail - Important email alerts
END:VCARD`

      const vcardBlob = new Blob([vcard], { type: "text/vcard" })
      const url = URL.createObjectURL(vcardBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = "CallMail.vcf"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setContactAdded(true)
    }
  }

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      onNext()
    }
  }

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        // Welcome / Logo screen
        return (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-8 flex flex-col items-center gap-4">
              <Image
                src="/images/callmail-contact-photo.jpg"
                alt="CallMail Logo"
                width={80}
                height={80}
                className="rounded-3xl"
              />
              <span className="text-3xl font-light tracking-tight text-foreground">CallMail</span>
            </div>
          </div>
        )
      case 1:
        // Value proposition
        return (
          <div className="flex flex-1 flex-col items-center justify-center px-8">
            <h1 className="mb-6 text-center text-3xl font-light leading-tight text-foreground text-balance">
              Get instant calls for emails that matter.
            </h1>
            <p className="mb-12 text-center text-2xl font-light text-foreground">Respond right away.</p>
            <div className="flex items-center gap-6">
              <Mail className="h-8 w-8 text-foreground" strokeWidth={1} />
              <div className="flex items-center">
                <span className="text-muted-foreground">~</span>
                <span className="mx-1 text-muted-foreground">~</span>
                <span className="text-muted-foreground">~</span>
              </div>
              <Phone className="h-8 w-8 text-foreground" strokeWidth={1} />
            </div>
          </div>
        )
      case 2:
        // VIP Contacts
        return (
          <div className="flex flex-1 flex-col items-center justify-center px-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-foreground" />
            </div>
            <h2 className="mb-4 text-center text-2xl font-medium text-foreground">VIP Contacts</h2>
            <p className="text-center text-muted-foreground max-w-sm leading-relaxed">
              Add email addresses of important people. Get called whenever they email you.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1.5 bg-muted rounded-full text-sm">boss@company.com</span>
              <span className="px-3 py-1.5 bg-muted rounded-full text-sm">client@work.com</span>
            </div>
          </div>
        )
      case 3:
        // VIP Domains
        return (
          <div className="flex flex-1 flex-col items-center justify-center px-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
              <Globe className="w-8 h-8 text-foreground" />
            </div>
            <h2 className="mb-4 text-center text-2xl font-medium text-foreground">VIP Domains</h2>
            <p className="text-center text-muted-foreground max-w-sm leading-relaxed">
              Monitor entire organizations. Get called for any email from @company.com.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1.5 bg-muted rounded-full text-sm">@importantclient.com</span>
              <span className="px-3 py-1.5 bg-muted rounded-full text-sm">@mycompany.com</span>
            </div>
          </div>
        )
      case 4:
        // Keywords
        return (
          <div className="flex flex-1 flex-col items-center justify-center px-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-foreground" />
            </div>
            <h2 className="mb-4 text-center text-2xl font-medium text-foreground">Alert Keywords</h2>
            <p className="text-center text-muted-foreground max-w-sm leading-relaxed">
              Set keywords that trigger calls. Get alerted when urgent subjects arrive.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1.5 bg-muted rounded-full text-sm">urgent</span>
              <span className="px-3 py-1.5 bg-muted rounded-full text-sm">invoice</span>
              <span className="px-3 py-1.5 bg-muted rounded-full text-sm">deadline</span>
            </div>
          </div>
        )
      case 5:
        // Quiet Hours
        return (
          <div className="flex flex-1 flex-col items-center justify-center px-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
              <Moon className="w-8 h-8 text-foreground" />
            </div>
            <h2 className="mb-4 text-center text-2xl font-medium text-foreground">Quiet Hours</h2>
            <p className="text-center text-muted-foreground max-w-sm leading-relaxed">
              Set times when you don't want calls. Perfect for sleep or focused work time.
            </p>
            <div className="mt-8 px-6 py-4 bg-muted rounded-2xl">
              <p className="text-sm text-muted-foreground text-center">Example: No calls 11pm - 7am</p>
            </div>
          </div>
        )
      case 6:
        // Add contact
        return (
          <div className="flex flex-1 flex-col items-center justify-center px-8">
            <h1 className="mb-4 text-center text-2xl font-medium text-foreground">Add CallMail as a contact</h1>
            <p className="mb-8 text-center text-muted-foreground">
              So you know when we're calling about an important email
            </p>

            <div className="mb-8 flex items-center gap-3">
              <span className="text-lg text-foreground">Important Email...</span>
              {contactAdded ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <span className="text-2xl">👋</span>
              )}
              <Button
                size="sm"
                variant="default"
                className="rounded-full px-4 py-1 text-sm"
                onClick={downloadContactCard}
                disabled={contactAdded}
              >
                {contactAdded ? "Saved" : "Save"}
              </Button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      {currentSlide > 0 && (
        <div className="px-8 pt-12">
          <div className="h-1 w-full rounded-full bg-muted">
            <div
              className="h-1 rounded-full bg-foreground transition-all duration-300"
              style={{ width: `${(currentSlide / (totalSlides - 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {renderSlide()}

      {/* Bottom section */}
      <div className="px-8 pb-12">
        <Button
          className="w-full rounded-full py-6 text-base font-medium"
          onClick={nextSlide}
          disabled={currentSlide === 6 && !contactAdded}
        >
          {currentSlide === 0 ? "Get Started" : "Continue"}
        </Button>

        {currentSlide === 0 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button onClick={onNext} className="underline text-foreground">
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
