// Dual input validator with invisible form background
import { useState, startTransition } from "react"
import { addPropertyControls, ControlType } from "framer"

/**
 * DualValidator
 *
 * Two input fields (email & invite code) and a button. Button validates both via Supabase edge functions.
 * Form background is invisible (transparent).
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
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
        buttonBgImage, // new prop
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

    // Email validation
    async function validateEmail(email) {
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
                startTransition(() => {
                    setEmailError(`API Error: ${errorText}`)
                    setEmailValidated(false)
                })
                return false
            }
            const data = await response.json()
            if (data && data.allowed === true) {
                startTransition(() => {
                    setEmailValidated(true)
                    setEmailError("")
                })
                return true
            } else {
                startTransition(() => {
                    setEmailError("Email not found or not allowed")
                    setEmailValidated(false)
                })
                return false
            }
        } catch (e) {
            startTransition(() => {
                setEmailError(
                    e.message || "Email validation failed. Try again."
                )
                setEmailValidated(false)
            })
            return false
        }
    }

    // Invite code validation
    async function validateInviteCode(inviteCode) {
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
                startTransition(() => {
                    setInviteError(`API Error: ${errorText}`)
                    setInviteValidated(false)
                    setEventName("")
                })
                return false
            }
            const data = await response.json()
            if (data.valid) {
                startTransition(() => {
                    setInviteValidated(true)
                    setInviteError("")
                    setEventName(data.event?.name || "")
                })
                return true
            } else {
                startTransition(() => {
                    setInviteError("Invalid invite code")
                    setInviteValidated(false)
                    setEventName("")
                })
                return false
            }
        } catch (e) {
            startTransition(() => {
                setInviteError(
                    e.message || "Invite validation failed. Try again."
                )
                setInviteValidated(false)
                setEventName("")
            })
            return false
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            startTransition(() => {
                setEmailError("Valid email is required.")
                setEmailValidated(false)
            })
            return
        }
        if (!inviteCode) {
            startTransition(() => {
                setInviteError("Invite code is required.")
                setInviteValidated(false)
                setEventName("")
            })
            return
        }
        startTransition(() => {
            setLoading(true)
            setEmailError("")
            setInviteError("")
            setSubmitted(false)
            setEmailValidated(false)
            setInviteValidated(false)
            setEventName("")
        })
        try {
            Promise.all([validateEmail(email), validateInviteCode(inviteCode)])
                .then(([emailValid, inviteValid]) => {
                    if (emailValid && inviteValid) {
                        startTransition(() => {
                            setSubmitted(true)
                        })
                        onSuccess?.()
                        // Redirect to success page after a brief delay
                        setTimeout(() => {
                            window.location.href =
                                props.successPageUrl ||
                                "https://www.wingedapp.com/"
                        }, 1500)
                    } else {
                        onFail?.()
                    }
                })
                .finally(() => {
                    startTransition(() => {
                        setLoading(false)
                    })
                })
        } catch (error) {
            startTransition(() => {
                setLoading(false)
            })
            onFail?.()
        }
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
                background: "transparent", // invisible background
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
                    <div
                        style={{
                            width: 24,
                            height: 24,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                            background: emailValidated
                                ? "#388E3C"
                                : emailError
                                  ? "#D32F2F"
                                  : "#eee",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: "bold",
                        }}
                    >
                        {emailValidated ? "✓" : emailError ? "✗" : "?"}
                    </div>
                </div>
                {emailError && (
                    <div
                        style={{
                            fontSize: 14,
                            color: "#D32F2F",
                            ...(messageFont || {}),
                            fontFamily: messageFont?.fontFamily,
                        }}
                    >
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
                    <div
                        style={{
                            width: 24,
                            height: 24,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                            background: inviteValidated
                                ? "#388E3C"
                                : inviteError
                                  ? "#D32F2F"
                                  : "#eee",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: "bold",
                        }}
                    >
                        {inviteValidated ? "✓" : inviteError ? "✗" : "?"}
                    </div>
                </div>
                {inviteError && (
                    <div
                        style={{
                            fontSize: 14,
                            color: "#D32F2F",
                            ...(messageFont || {}),
                            fontFamily: messageFont?.fontFamily,
                        }}
                    >
                        {inviteError}
                    </div>
                )}
                {inviteValidated && eventName && (
                    <div
                        style={{
                            fontSize: 14,
                            color: "#388E3C",
                            ...(messageFont || {}),
                            fontFamily: messageFont?.fontFamily,
                        }}
                    >
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
                    background: buttonBgImage?.src
                        ? `url(${buttonBgImage.src}) center/cover, ${loading ? "#ccc" : allValid ? "#388E3C" : buttonColor}`
                        : loading
                          ? "#ccc"
                          : allValid
                            ? "#388E3C"
                            : buttonColor,
                    color: buttonTextColor,
                    border: "none",
                    cursor:
                        loading || !email || !inviteCode
                            ? "not-allowed"
                            : "pointer",
                    transition: "all 0.2s",
                    fontSize: 16,
                    fontWeight: "600",
                    ...(buttonFont || {}),
                }}
            >
                {loading ? (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                        }}
                    >
                        <div
                            style={{
                                width: 16,
                                height: 16,
                                border: "2px solid transparent",
                                borderTop: `2px solid ${buttonTextColor}`,
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite",
                            }}
                        />
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
                <div
                    style={{
                        padding: 12,
                        borderRadius: 6,
                        background: "#E8F5E8",
                        color: "#388E3C",
                        textAlign: "center",
                        fontSize: 14,
                        ...(messageFont || {}),
                        fontFamily: messageFont?.fontFamily,
                    }}
                >
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
        defaultValue:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdWNzbGdxeGhuZmdtY3dscHBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDg4NDcsImV4cCI6MjA3MzUyNDg0N30.gj3yEB9_1_UXsFpG6VoGL03v2ImJCAweijG3HOHlcgQ",
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
    buttonBgImage: {
        type: ControlType.ResponsiveImage,
        title: "Button BG Image",
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
    successPageUrl: {
        type: ControlType.String,
        title: "Success Page URL",
        defaultValue: "https://www.wingedapp.com/",
        placeholder: "/success or https://example.com",
    },
})
