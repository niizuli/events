import { useState, startTransition } from "react"
import { addPropertyControls, ControlType } from "framer"

// Email Validation Function (copied from working EmailTest)
async function validateEmail(
    email,
    supabaseUrl,
    supabaseKey,
    setEmailError,
    setEmailValidated
) {
    try {
        const response = await fetch(
            `${supabaseUrl}/functions/v1/validate-email`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${supabaseKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            setEmailError(`API Error: ${errorText}`)
            return false
        }

        const data = await response.json()

        if (data && data.allowed === true) {
            setEmailValidated(true)
            setEmailError("")
            return true
        } else {
            setEmailError("Email not found or not allowed")
            return false
        }
    } catch (e) {
        setEmailError(e.message || "Email validation failed. Try again.")
        return false
    }
}

// Invite Code Validation Function (copied from working InviteCodeValidator)
async function validateInviteCode(
    inviteCode,
    supabaseUrl,
    supabaseKey,
    setInviteError,
    setInviteValidated,
    setEventName
) {
    try {
        const response = await fetch(
            `${supabaseUrl}/functions/v1/validate-invite-code`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${supabaseKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ inviteCode }),
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            setInviteError(`API Error: ${errorText}`)
            return false
        }

        const data = await response.json()

        if (data.valid) {
            setInviteValidated(true)
            setInviteError("")
            setEventName(data.event?.name || "")
            return true
        } else {
            setInviteError("Invalid invite code")
            return false
        }
    } catch (e) {
        setInviteError(e.message || "Invite validation failed. Try again.")
        return false
    }
}

export default function DualValidator(props) {
    const {
        supabaseUrl,
        supabaseKey,
        emailPlaceholder,
        invitePlaceholder,
        submitLabel,
        loadingLabel,
        buttonColor,
        buttonTextColor,
        buttonFont,
        inputFont,
        messageFont,
        onSuccess,
        onFail,
    } = props

    // Email state
    const [email, setEmail] = useState("")
    const [emailValidated, setEmailValidated] = useState(false)
    const [emailError, setEmailError] = useState("")
    
    // Invite code state
    const [inviteCode, setInviteCode] = useState("")
    const [inviteValidated, setInviteValidated] = useState(false)
    const [inviteError, setInviteError] = useState("")
    const [eventName, setEventName] = useState("")
    
    // Form state
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        
        // Basic validation
        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            setEmailError("Valid email is required.")
            return
        }
        
        if (!inviteCode) {
            setInviteError("Invite code is required.")
            return
        }

        setLoading(true)
        setEmailError("")
        setInviteError("")
        setSubmitted(false)
        setEmailValidated(false)
        setInviteValidated(false)

        startTransition(async () => {
            try {
                // Validate both simultaneously using the exact same pattern as working components
                const [emailValid, inviteValid] = await Promise.all([
                    validateEmail(email, supabaseUrl, supabaseKey, setEmailError, setEmailValidated),
                    validateInviteCode(inviteCode, supabaseUrl, supabaseKey, setInviteError, setInviteValidated, setEventName)
                ])

                if (emailValid && inviteValid) {
                    setSubmitted(true)
                    onSuccess?.()
                } else {
                    onFail?.()
                }
            } catch (error) {
                console.error("Validation error:", error)
                onFail?.()
            } finally {
                setLoading(false)
            }
        })
    }

    // Reset validation when inputs change
    const handleEmailChange = (e) => {
        setEmail(e.target.value)
        if (emailValidated || emailError) {
            setEmailValidated(false)
            setEmailError("")
        }
    }

    const handleInviteChange = (e) => {
        setInviteCode(e.target.value)
        if (inviteValidated || inviteError) {
            setInviteValidated(false)
            setInviteError("")
            setEventName("")
        }
    }

    const allValid = emailValidated && inviteValidated
    const hasErrors = emailError || inviteError

    return (
        <form
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                minWidth: 360,
                maxWidth: 480,
                padding: 20,
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
            onSubmit={handleSubmit}
            autoComplete="off"
        >
            {/* Email Input Row */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder={emailPlaceholder}
                        style={{
                            flex: 1,
                            padding: "0 12px",
                            height: 40,
                            borderRadius: 6,
                            border: `1px solid ${emailError ? "#D32F2F" : emailValidated ? "#388E3C" : "#eee"}`,
                            fontSize: 14,
                            boxSizing: "border-box",
                            ...(inputFont || {}),
                        }}
                        required
                        autoComplete="off"
                    />
                    <div style={{
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        background: emailValidated ? "#388E3C" : emailError ? "#D32F2F" : "#eee",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: "bold"
                    }}>
                        {emailValidated ? "✓" : emailError ? "✗" : "?"}
                    </div>
                </div>
                {emailError && (
                    <div style={{
                        fontSize: 14,
                        color: "#D32F2F",
                        ...(messageFont || {}),
                        fontFamily: messageFont?.fontFamily,
                    }}>
                        {emailError}
                    </div>
                )}
            </div>

            {/* Invite Code Input Row */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                        type="text"
                        value={inviteCode}
                        onChange={handleInviteChange}
                        placeholder={invitePlaceholder}
                        style={{
                            flex: 1,
                            padding: "0 12px",
                            height: 40,
                            borderRadius: 6,
                            border: `1px solid ${inviteError ? "#D32F2F" : inviteValidated ? "#388E3C" : "#eee"}`,
                            fontSize: 14,
                            boxSizing: "border-box",
                            ...(inputFont || {}),
                        }}
                        required
                        autoComplete="off"
                    />
                    <div style={{
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        background: inviteValidated ? "#388E3C" : inviteError ? "#D32F2F" : "#eee",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: "bold"
                    }}>
                        {inviteValidated ? "✓" : inviteError ? "✗" : "?"}
                    </div>
                </div>
                {inviteError && (
                    <div style={{
                        fontSize: 14,
                        color: "#D32F2F",
                        ...(messageFont || {}),
                        fontFamily: messageFont?.fontFamily,
                    }}>
                        {inviteError}
                    </div>
                )}
                {inviteValidated && eventName && (
                    <div style={{
                        fontSize: 14,
                        color: "#388E3C",
                        ...(messageFont || {}),
                        fontFamily: messageFont?.fontFamily,
                    }}>
                        Event: {eventName}
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading || !email || !inviteCode}
                style={{
                    width: "100%",
                    height: 44,
                    borderRadius: 6,
                    background: loading ? "#ccc" : (allValid ? "#388E3C" : buttonColor),
                    color: buttonTextColor,
                    border: "none",
                    cursor: loading || (!email || !inviteCode) ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    fontSize: 16,
                    fontWeight: "600",
                    ...(buttonFont || {}),
                }}
            >
                {loading ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <div style={{
                            width: 16,
                            height: 16,
                            border: "2px solid transparent",
                            borderTop: `2px solid ${buttonTextColor}`,
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite"
                        }} />
                        {loadingLabel}
                    </div>
                ) : submitted ? (
                    "Success! ✓"
                ) : allValid ? (
                    "All Valid - Submit"
                ) : (
                    submitLabel
                )}
            </button>

            {/* Success Message */}
            {submitted && !hasErrors && (
                <div style={{
                    padding: 12,
                    borderRadius: 6,
                    background: "#E8F5E8",
                    color: "#388E3C",
                    textAlign: "center",
                    fontSize: 14,
                    ...(messageFont || {}),
                    fontFamily: messageFont?.fontFamily,
                }}>
                    ✓ Both email and invite code validated successfully!
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </form>
    )
}

addPropertyControls(DualValidator, {
    supabaseUrl: {
        type: ControlType.String,
        title: "Supabase URL",
        defaultValue: "https://xiucslgqxhnfgmcwlppq.supabase.co",
    },
    supabaseKey: {
        type: ControlType.String,
        title: "Supabase Key",
        obscured: true,
        defaultValue: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdWNzbGdxeGhuZmdtY3dscHBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDg4NDcsImV4cCI6MjA3MzUyNDg0N30.gj3yEB9_1_UXsFpG6VoGL03v2ImJCAweijG3HOHlcgQ",
    },
    emailPlaceholder: {
        type: ControlType.String,
        title: "Email Placeholder",
        defaultValue: "Enter email address",
    },
    invitePlaceholder: {
        type: ControlType.String,
        title: "Invite Placeholder", 
        defaultValue: "Enter invite code",
    },
    submitLabel: {
        type: ControlType.String,
        title: "Submit Label",
        defaultValue: "Validate & Submit",
    },
    loadingLabel: {
        type: ControlType.String,
        title: "Loading Label",
        defaultValue: "Validating...",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#007bff",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text Color",
        defaultValue: "#fff",
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Semibold",
            fontSize: "16px",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    inputFont: {
        type: ControlType.Font,
        title: "Input Font", 
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Regular",
            fontSize: "14px",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    messageFont: {
        type: ControlType.Font,
        title: "Message Font",
        controls: "extended", 
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Regular",
            fontSize: "14px",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
})