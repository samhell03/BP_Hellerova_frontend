import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import {
  googleLoginUser,
  loginUser,
  registerUser,
  verifyRegistrationCode,
  resendRegistrationCode,
  saveAuthData
} from "../../api/auth";
import { showSuccess, showError } from "../../utils/toast";

function getGoogleClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
}

function validateRegisterName(userName) {
  const trimmed = userName.trim();

  if (!trimmed) {
    return "Zadej jméno.";
  }

  if (trimmed.length < 2) {
    return "Jméno musí mít alespoň 2 znaky.";
  }

  if (trimmed.length > 50) {
    return "Jméno může mít maximálně 50 znaků.";
  }

  return "";
}

function validateEmail(email) {
  const trimmed = email.trim();

  if (!trimmed) {
    return "Zadej email.";
  }

  if (trimmed !== email) {
    return "Email nesmí začínat ani končit mezerou.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return "Zadej platný email.";
  }

  return "";
}

function validatePassword(password) {
  if (!password) {
    return "Zadej heslo.";
  }

  if (password !== password.trim()) {
    return "Heslo nesmí začínat ani končit mezerou.";
  }

  if (password.length < 6) {
    return "Heslo musí mít alespoň 6 znaků.";
  }

  if (!/[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(password)) {
    return "Heslo musí obsahovat alespoň jedno velké písmeno.";
  }

  if (!(/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password))) {
    return "Heslo musí obsahovat alespoň číslici nebo speciální znak.";
  }

  return "";
}

function getPasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      label: "Zatím nezadáno",
      className: ""
    };
  }

  let score = 0;

  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return {
      score,
      label: "Slabé heslo",
      className: "weak"
    };
  }

  if (score <= 4) {
    return {
      score,
      label: "Středně silné heslo",
      className: "medium"
    };
  }

  return {
    score,
    label: "Silné heslo",
    className: "strong"
  };
}

function AuthForm({
  setIsLoggedIn,
  setUserId,
  setUserName,
  fetchTrips,
  onSuccess
}) {
  const [isRegistering, setIsRegistering] = useState(false);

  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");
  const [isAwaitingVerification, setIsAwaitingVerification] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [fieldErrors, setFieldErrors] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [formMessage, setFormMessage] = useState({
    type: "",
    text: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false
  });

  const googleButtonRef = useRef(null);

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  const clearMessages = () => {
    setFormMessage({
      type: "",
      text: ""
    });
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    clearMessages();

    setFieldErrors((prev) => {
      const next = {
        ...prev,
        [field]: ""
      };

      const nextValues = {
        ...formData,
        [field]: value
      };

      if (field === "userName" && isRegistering) {
        next.userName = value ? validateRegisterName(value) : "";
      }

      if (field === "email") {
        next.email = value ? validateEmail(value) : "";
      }

      if (field === "password") {
        next.password = value ? validatePassword(value) : "";

        if (isRegistering && nextValues.confirmPassword) {
          next.confirmPassword =
            value === nextValues.confirmPassword ? "" : "Hesla se neshodují.";
        }
      }

      if (field === "confirmPassword") {
        if (value && value !== value.trim()) {
          next.confirmPassword = "Heslo nesmí začínat ani končit mezerou.";
        } else if (value && value !== nextValues.password) {
          next.confirmPassword = "Hesla se neshodují.";
        } else {
          next.confirmPassword = "";
        }
      }

      return next;
    });
  };

  const toggleMode = () => {
    setIsRegistering((prev) => !prev);
    setIsAwaitingVerification(false);
    setPendingVerificationEmail("");
    setRegistrationCode("");
    setFormData({
      userName: "",
      email: "",
      password: "",
      confirmPassword: ""
    });
    setFieldErrors({
      userName: "",
      email: "",
      password: "",
      confirmPassword: ""
    });
    setFormMessage({
      type: "",
      text: ""
    });
    setShowPassword({
      password: false,
      confirmPassword: false
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateRegisterForm = () => {
    const nextErrors = {
      userName: "",
      email: "",
      password: "",
      confirmPassword: ""
    };

    nextErrors.userName = validateRegisterName(formData.userName);
    nextErrors.email = validateEmail(formData.email);
    nextErrors.password = validatePassword(formData.password);

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Potvrď heslo.";
    } else if (formData.confirmPassword !== formData.confirmPassword.trim()) {
      nextErrors.confirmPassword = "Heslo nesmí začínat ani končit mezerou.";
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Hesla se neshodují.";
    }

    setFieldErrors(nextErrors);

    return (
      !nextErrors.userName &&
      !nextErrors.email &&
      !nextErrors.password &&
      !nextErrors.confirmPassword
    );
  };

  const validateLoginForm = () => {
    const nextErrors = {
      userName: "",
      email: "",
      password: "",
      confirmPassword: ""
    };

    nextErrors.email = validateEmail(formData.email);

    if (!formData.password) {
      nextErrors.password = "Zadej heslo.";
    }

    setFieldErrors(nextErrors);

    return !nextErrors.email && !nextErrors.password;
  };

  const handleGoogleLogin = useCallback(
    async (googleResponse) => {
      try {
        clearMessages();
        setIsSubmitting(true);

        if (!googleResponse?.credential) {
          throw new Error("Google nepředal přihlašovací token.");
        }

        const data = await googleLoginUser(googleResponse.credential);

        saveAuthData(data);
        setUserId(data.userId);
        setUserName(data.userName);
        setIsLoggedIn(true);
        showSuccess("Přihlášení přes Google proběhlo úspěšně.");

        await fetchTrips();

        if (onSuccess) {
          onSuccess();
        }
      } catch (err) {
        const message =
          err.message || "Přihlášení přes Google se nepodařilo.";

        setFormMessage({
          type: "error",
          text: message
        });

        showError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchTrips, onSuccess, setIsLoggedIn, setUserId, setUserName]
  );

  useEffect(() => {
    if (isRegistering || isAwaitingVerification) {
      return;
    }

    const clientId = getGoogleClientId();

    if (!clientId) {
      setFormMessage({
        type: "error",
        text: "Chybí VITE_GOOGLE_CLIENT_ID ve frontend .env."
      });
      return;
    }

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) {
        return;
      }

      try {
        googleButtonRef.current.innerHTML = "";

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleLogin
        });

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          locale: "cs",
          width: 260
        });
      } catch {
        setFormMessage({
          type: "error",
          text: "Google tlačítko se nepodařilo vykreslit."
        });
      }
    };

    const timeoutId = window.setTimeout(renderGoogleButton, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isRegistering, isAwaitingVerification, handleGoogleLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    clearMessages();

    const isValid = isRegistering
      ? validateRegisterForm()
      : validateLoginForm();

    if (!isValid) {
      return;
    }

    try {
      setIsSubmitting(true);

      if (isRegistering) {
        const data = await registerUser({
          userName: formData.userName.trim(),
          email: formData.email.trim(),
          password: formData.password
        });

        setPendingVerificationEmail(data.email || formData.email.trim().toLowerCase());
        setIsAwaitingVerification(true);
        setRegistrationCode("");

        setFormMessage({
          type: "success",
          text: data.message || "Na váš e-mail byl odeslán ověřovací kód."
        });

        showSuccess("Na e-mail byl odeslán ověřovací kód.");
        return;
      }

      const data = await loginUser({
        email: formData.email.trim(),
        password: formData.password
      });

      saveAuthData(data);
      setUserId(data.userId);
      setUserName(data.userName);
      setIsLoggedIn(true);
      showSuccess("Přihlášení proběhlo úspěšně.");

      await fetchTrips();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const rawMessage = err.message || "Došlo k chybě.";
      const normalizedMessage = rawMessage.toLowerCase();

      if (isRegistering) {
        if (normalizedMessage.includes("email") && normalizedMessage.includes("exist")) {
          const message = "Uživatel s tímto emailem už existuje.";

          setFieldErrors((prev) => ({
            ...prev,
            email: message
          }));
          showError(message);
          return;
        }

        if (normalizedMessage.includes("jméno") || normalizedMessage.includes("jmeno")) {
          setFieldErrors((prev) => ({
            ...prev,
            userName: rawMessage
          }));
          showError(rawMessage);
          return;
        }

        if (normalizedMessage.includes("heslo")) {
          setFieldErrors((prev) => ({
            ...prev,
            password: rawMessage
          }));
          showError(rawMessage);
          return;
        }

        if (normalizedMessage.includes("email")) {
          setFieldErrors((prev) => ({
            ...prev,
            email: rawMessage
          }));
          showError(rawMessage);
          return;
        }
      } else {
        if (
          normalizedMessage.includes("neplatný email nebo heslo") ||
          normalizedMessage.includes("neplatny email nebo heslo")
        ) {
          const message = "Neplatný email nebo heslo.";

          setFormMessage({
            type: "error",
            text: message
          });
          showError(message);
          return;
        }

        if (normalizedMessage.includes("google")) {
          setFormMessage({
            type: "error",
            text: rawMessage
          });
          showError(rawMessage);
          return;
        }
      }

      setFormMessage({
        type: "error",
        text: rawMessage
      });
      showError(rawMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyRegistrationCode = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!registrationCode.trim()) {
      setFormMessage({
        type: "error",
        text: "Zadejte ověřovací kód."
      });
      showError("Zadejte ověřovací kód.");
      return;
    }

    try {
      setIsSendingVerification(true);

      const data = await verifyRegistrationCode(
        pendingVerificationEmail,
        registrationCode.trim()
      );

      saveAuthData(data);
      setUserId(data.userId);
      setUserName(data.userName);
      setIsLoggedIn(true);

      setFormMessage({
        type: "success",
        text: data.message || "E-mail byl ověřen a účet vytvořen."
      });

      showSuccess("E-mail byl ověřen a účet byl vytvořen.");

      await fetchTrips();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const message =
        error.message || "Nepodařilo se ověřit registrační kód.";

      setFormMessage({
        type: "error",
        text: message
      });
      showError(message);
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleResendRegistrationCode = async () => {
    clearMessages();

    try {
      setIsSendingVerification(true);

      const data = await resendRegistrationCode(pendingVerificationEmail);

      setFormMessage({
        type: "success",
        text: data.message || "Nový ověřovací kód byl odeslán."
      });

      showSuccess("Nový ověřovací kód byl odeslán.");
    } catch (error) {
      const message =
        error.message || "Nepodařilo se znovu odeslat ověřovací kód.";

      setFormMessage({
        type: "error",
        text: message
      });
      showError(message);
    } finally {
      setIsSendingVerification(false);
    }
  };

  if (isAwaitingVerification) {
    return (
      <form className="sidebar-auth-form" onSubmit={handleVerifyRegistrationCode}>
        <h2 className="sidebar-form-title">Ověření e-mailu</h2>

        {formMessage.text && (
          <div className={`sidebar-form-message ${formMessage.type}`}>
            {formMessage.text}
          </div>
        )}

        <p className="sidebar-password-hint" style={{ marginBottom: "1rem" }}>
          Na adresu <strong>{pendingVerificationEmail}</strong> jsme poslali
          ověřovací kód. Zadej ho sem pro dokončení registrace.
        </p>

        <div className="sidebar-form-group">
          <input
            className="sidebar-input"
            type="text"
            placeholder="Ověřovací kód"
            value={registrationCode}
            onChange={(e) => setRegistrationCode(e.target.value)}
            maxLength={6}
            inputMode="numeric"
          />
        </div>

        <button
          className="btn-primary"
          type="submit"
          disabled={isSendingVerification}
        >
          {isSendingVerification ? "Ověřuji..." : "Ověřit e-mail a vytvořit účet"}
        </button>

        <button
          className="btn-secondary"
          type="button"
          onClick={handleResendRegistrationCode}
          disabled={isSendingVerification}
          style={{ marginTop: "0.75rem" }}
        >
          Poslat kód znovu
        </button>

        <div className="sidebar-form-footer">
          Špatný e-mail nebo se chceš vrátit?
          <span
            className="sidebar-form-link"
            onClick={() => {
              setIsAwaitingVerification(false);
              setPendingVerificationEmail("");
              setRegistrationCode("");
              setFormMessage({ type: "", text: "" });
            }}
          >
            {" "}Zpět
          </span>
        </div>
      </form>
    );
  }

  return (
    <form className="sidebar-auth-form" onSubmit={handleSubmit}>
      <h2 className="sidebar-form-title">
        {isRegistering ? "Vytvořit účet" : "Přihlášení"}
      </h2>

      {formMessage.text && (
        <div className={`sidebar-form-message ${formMessage.type}`}>
          {formMessage.text}
        </div>
      )}

      {isRegistering && (
        <div className="sidebar-form-group">
          <input
            className={`sidebar-input ${fieldErrors.userName ? "has-error" : ""}`}
            type="text"
            placeholder="Vaše jméno"
            value={formData.userName}
            onChange={(e) => handleChange("userName", e.target.value)}
          />
          {fieldErrors.userName && (
            <p className="sidebar-field-error">{fieldErrors.userName}</p>
          )}
        </div>
      )}

      <div className="sidebar-form-group">
        <input
          className={`sidebar-input ${fieldErrors.email ? "has-error" : ""}`}
          type="email"
          placeholder="Váš email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />
        {fieldErrors.email && (
          <p className="sidebar-field-error">{fieldErrors.email}</p>
        )}
      </div>

      <div className="sidebar-form-group">
        <div className="sidebar-password-wrapper">
          <input
            className={`sidebar-input ${fieldErrors.password ? "has-error" : ""}`}
            type={showPassword.password ? "text" : "password"}
            placeholder="Heslo"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
          />
          <button
            className="sidebar-password-toggle"
            type="button"
            onClick={() => togglePasswordVisibility("password")}
            aria-label={showPassword.password ? "Skrýt heslo" : "Zobrazit heslo"}
          >
            {showPassword.password ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

        {fieldErrors.password && (
          <p className="sidebar-field-error">{fieldErrors.password}</p>
        )}

        {isRegistering && (
          <>
            <div className="sidebar-password-strength">
              <div className="sidebar-password-strength-bars">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <span
                    key={bar}
                    className={`sidebar-strength-bar ${
                      bar <= passwordStrength.score ? passwordStrength.className : ""
                    }`}
                  />
                ))}
              </div>

              <span className="sidebar-password-strength-label">
                {passwordStrength.label}
              </span>
            </div>

            <p className="sidebar-password-hint">
              Heslo musí mít alespoň 6 znaků, jedno velké písmeno a číslici
              nebo speciální znak.
            </p>
          </>
        )}
      </div>

      {isRegistering && (
        <div className="sidebar-form-group">
          <div className="sidebar-password-wrapper">
            <input
              className={`sidebar-input ${fieldErrors.confirmPassword ? "has-error" : ""}`}
              type={showPassword.confirmPassword ? "text" : "password"}
              placeholder="Potvrzení hesla"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
            />
            <button
              className="sidebar-password-toggle"
              type="button"
              onClick={() => togglePasswordVisibility("confirmPassword")}
              aria-label={
                showPassword.confirmPassword ? "Skrýt heslo" : "Zobrazit heslo"
              }
            >
              {showPassword.confirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {fieldErrors.confirmPassword && (
            <p className="sidebar-field-error">{fieldErrors.confirmPassword}</p>
          )}
        </div>
      )}

      <button className="btn-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? "Ukládám..."
          : isRegistering
            ? "Zaregistrovat se"
            : "Přihlásit se"}
      </button>

      {!isRegistering && (
        <>
          <div className="sidebar-auth-divider">
            <span>nebo</span>
          </div>

          <div ref={googleButtonRef} className="sidebar-google-button"></div>
        </>
      )}

      <div className="sidebar-form-footer">
        {isRegistering ? "Již máte účet?" : "Nemáte účet?"}
        <span className="sidebar-form-link" onClick={toggleMode}>
          {isRegistering ? " Přihlásit se" : " Registrovat"}
        </span>
      </div>
    </form>
  );
}

export default AuthForm;