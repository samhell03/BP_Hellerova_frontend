import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiEye, FiEyeOff } from "react-icons/fi";
import "../styles/profile.css";
import {
  confirmPasswordChange,
  fetchMeDetailed,
  requestPasswordChangeCode,
  updateUserName
} from "../api/auth";

function getTripPhase(trip) {
  const today = new Date();
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);

  if (start <= today && end >= today) return "ongoing";
  if (end < today) return "past";
  return "upcoming";
}

function getInitials(name) {
  if (!name) return "U";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function validateNewPassword(password) {
  const errors = [];

  if (!password) {
    errors.push("Zadejte nové heslo.");
    return errors;
  }

  if (password !== password.trim()) {
    errors.push("Heslo nesmí začínat ani končit mezerou.");
  }

  if (password.length < 6) {
    errors.push("Heslo musí mít alespoň 6 znaků.");
  }

  if (!/[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(password)) {
    errors.push("Heslo musí obsahovat alespoň jedno velké písmeno.");
  }

  if (!(/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password))) {
    errors.push("Heslo musí obsahovat alespoň číslici nebo speciální znak.");
  }

  return errors;
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

function Profile({ isLoggedIn, myTrips, setUserName }) {
  const [profile, setProfile] = useState({
    userId: "",
    userName: "",
    email: "",
    createdAt: "",
    authProvider: ""
  });

  const [nameValue, setNameValue] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameMessage, setNameMessage] = useState({
    type: "",
    text: ""
  });
  const [isSavingName, setIsSavingName] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [fieldErrors, setFieldErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [formMessage, setFormMessage] = useState({
    type: "",
    text: ""
  });

  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [verificationCode, setVerificationCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchMeDetailed();
        const userData = data?.user || data;

        if (userData) {
          setProfile({
            userId: userData.userId || userData._id || "",
            userName: userData.userName || "",
            email: userData.email || "",
            createdAt: userData.createdAt || "",
            authProvider: userData.authProvider || ""
          });

          setNameValue(userData.userName || "");
        }
      } catch (error) {
        console.error("Chyba při načítání profilu:", error);
      }
    };

    if (isLoggedIn) {
      loadProfile();
    }
  }, [isLoggedIn]);

  const stats = useMemo(() => {
    const visitedCountries = new Set(
      myTrips
        .filter((trip) => getTripPhase(trip) === "past")
        .map((trip) => trip.countryCode?.toUpperCase())
        .filter(Boolean)
    ).size;

    const activeTrips = myTrips.filter((trip) => {
      const phase = getTripPhase(trip);
      return phase === "upcoming" || phase === "ongoing";
    }).length;

    const completedTrips = myTrips.filter(
      (trip) => getTripPhase(trip) === "past"
    ).length;

    return {
      totalTrips: myTrips.length,
      activeTrips,
      completedTrips,
      visitedCountries
    };
  }, [myTrips]);

  const passwordStrength = useMemo(
    () => getPasswordStrength(passwordData.newPassword),
    [passwordData.newPassword]
  );

  const validateName = (value) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return "Zadejte nové jméno.";
    }

    if (trimmed.length < 2) {
      return "Jméno musí mít alespoň 2 znaky.";
    }

    if (trimmed.length > 50) {
      return "Jméno může mít maximálně 50 znaků.";
    }

    if (trimmed === profile.userName) {
      return "Nové jméno se musí lišit od původního.";
    }

    return "";
  };

  const handleStartEditName = () => {
    setIsEditingName(true);
    setNameError("");
    setNameMessage({
      type: "",
      text: ""
    });
    setNameValue(profile.userName || "");
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setNameError("");
    setNameMessage({
      type: "",
      text: ""
    });
    setNameValue(profile.userName || "");
  };

  const handleNameChange = (value) => {
    setNameValue(value);
    setNameError("");
    setNameMessage({
      type: "",
      text: ""
    });
  };

  const handleSubmitName = async (e) => {
    e.preventDefault();

    const validationError = validateName(nameValue);

    if (validationError) {
      setNameError(validationError);
      return;
    }

    try {
      setIsSavingName(true);

      const data = await updateUserName(nameValue.trim());

      setProfile((prev) => ({
        ...prev,
        userName: data.userName || nameValue.trim(),
        email: data.email || prev.email,
        userId: data.userId || prev.userId
      }));

      setNameValue(data.userName || nameValue.trim());
      setUserName(data.userName || nameValue.trim());
      setIsEditingName(false);

      setNameMessage({
        type: "success",
        text: "Jméno bylo úspěšně změněno!"
      });

      setNameError("");
    } catch (error) {
      setNameMessage({
        type: "error",
        text: error.message || "Změna jména se nezdařila."
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value
    }));

    setIsCodeSent(false);
    setVerificationCode("");
    setCodeError("");

    setFormMessage({
      type: "",
      text: ""
    });

    setFieldErrors((prev) => {
      const next = {
        ...prev,
        [field]: ""
      };

      const nextValues = {
        ...passwordData,
        [field]: value
      };

      if (field === "currentPassword") {
        if (value && value !== value.trim()) {
          next.currentPassword = "Heslo nesmí začínat ani končit mezerou.";
        } else {
          next.currentPassword = "";
        }

        if (
          nextValues.newPassword &&
          value &&
          nextValues.newPassword === value
        ) {
          next.newPassword = "Nové heslo nesmí být stejné jako současné.";
        }
      }

      if (field === "newPassword") {
        const passwordErrors = validateNewPassword(value);
        next.newPassword = passwordErrors[0] || "";

        if (
          !next.newPassword &&
          nextValues.currentPassword &&
          value &&
          nextValues.currentPassword === value
        ) {
          next.newPassword = "Nové heslo nesmí být stejné jako současné.";
        }

        if (nextValues.confirmPassword && value !== nextValues.confirmPassword) {
          next.confirmPassword = "Hesla se neshodují.";
        } else {
          next.confirmPassword = "";
        }
      }

      if (field === "confirmPassword") {
        if (value && value !== value.trim()) {
          next.confirmPassword = "Heslo nesmí začínat ani končit mezerou.";
        } else if (value && value !== nextValues.newPassword) {
          next.confirmPassword = "Hesla se neshodují.";
        } else {
          next.confirmPassword = "";
        }
      }

      return next;
    });
  };

  const preventCopy = (e) => {
    e.preventDefault();
  };

  const preventPaste = (e) => {
    e.preventDefault();
  };

  const validatePasswordForm = () => {
    const nextErrors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    };

    if (!passwordData.currentPassword) {
      nextErrors.currentPassword = "Zadejte aktuální heslo.";
    } else if (passwordData.currentPassword !== passwordData.currentPassword.trim()) {
      nextErrors.currentPassword = "Heslo nesmí začínat ani končit mezerou.";
    }

    const passwordErrors = validateNewPassword(passwordData.newPassword);
    if (passwordErrors.length > 0) {
      nextErrors.newPassword = passwordErrors[0];
    }

    if (
      !nextErrors.newPassword &&
      passwordData.currentPassword &&
      passwordData.newPassword &&
      passwordData.currentPassword === passwordData.newPassword
    ) {
      nextErrors.newPassword = "Nové heslo nesmí být stejné jako současné.";
    }

    if (!passwordData.confirmPassword) {
      nextErrors.confirmPassword = "Potvrďte nové heslo.";
    } else if (passwordData.confirmPassword !== passwordData.confirmPassword.trim()) {
      nextErrors.confirmPassword = "Heslo nesmí začínat ani končit mezerou.";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      nextErrors.confirmPassword = "Hesla se neshodují.";
    }

    setFieldErrors(nextErrors);

    return (
      !nextErrors.currentPassword &&
      !nextErrors.newPassword &&
      !nextErrors.confirmPassword
    );
  };

  const handleRequestPasswordCode = async (e) => {
    e.preventDefault();

    setFormMessage({
      type: "",
      text: ""
    });

    setCodeError("");

    const isValid = validatePasswordForm();

    if (!isValid) {
      return;
    }

    try {
      setIsSavingPassword(true);

      const data = await requestPasswordChangeCode({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setIsCodeSent(true);

      setFormMessage({
        type: "success",
        text: data.message || "Ověřovací kód byl odeslán na váš e-mail."
      });
    } catch (error) {
      const rawMessage = error.message || "Odeslání ověřovacího kódu se nezdařilo.";
      const normalizedMessage = rawMessage.toLowerCase();

      if (
        normalizedMessage.includes("aktu") &&
        normalizedMessage.includes("heslo")
      ) {
        setFieldErrors((prev) => ({
          ...prev,
          currentPassword: "Aktuální heslo není správné."
        }));
        return;
      }

      if (
        normalizedMessage.includes("nov") &&
        normalizedMessage.includes("heslo") &&
        (normalizedMessage.includes("stejn") || normalizedMessage.includes("liš"))
      ) {
        setFieldErrors((prev) => ({
          ...prev,
          newPassword: "Nové heslo nesmí být stejné jako současné."
        }));
        return;
      }

      setFormMessage({
        type: "error",
        text: rawMessage
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();

    setFormMessage({
      type: "",
      text: ""
    });

    setCodeError("");

    if (!verificationCode.trim()) {
      setCodeError("Zadejte ověřovací kód z e-mailu.");
      return;
    }

    try {
      setIsSavingPassword(true);

      await confirmPasswordChange(verificationCode.trim());

      setFormMessage({
        type: "success",
        text: "Heslo bylo úspěšně změněno!"
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      setFieldErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      setShowPassword({
        current: false,
        new: false,
        confirm: false
      });

      setVerificationCode("");
      setCodeError("");
      setIsCodeSent(false);
    } catch (error) {
      const rawMessage = error.message || "Změna hesla se nezdařila.";
      const normalizedMessage = rawMessage.toLowerCase();

      if (
        normalizedMessage.includes("kód") &&
        (normalizedMessage.includes("správný") || normalizedMessage.includes("platnost"))
      ) {
        setCodeError(rawMessage);
        return;
      }

      setFormMessage({
        type: "error",
        text: rawMessage
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="content">
        <section className="card profile-page">
          <h1 className="profile-title">Profil</h1>
          <p className="profile-muted">Pro zobrazení profilu se prosím přihlaste</p>
        </section>
      </main>
    );
  }

  return (
    <main className="content">
      <section className="card profile-page">
        <div className="profile-hero">
          <div className="profile-identity">
            <div className="profile-avatar">{getInitials(profile.userName)}</div>

            <div className="profile-identity-text">
              <h1 className="profile-title">{profile.userName || "Uživatel"}</h1>
              <p className="profile-muted">{profile.email || "Email není dostupný"}</p>
            </div>
          </div>
        </div>

        <div className="profile-grid">
          <section className="profile-card">
            <div className="profile-card-header">
              <h2>Informace o účtu</h2>
              <p>Základní údaje o přihlášeném uživateli</p>
            </div>

            <div className="profile-info-list">
              <div className="profile-info-row profile-info-row-name">
                <div className="profile-info-row-top">
                  <span className="profile-info-label">Jméno</span>

                  {!isEditingName && (
                    <button
                      type="button"
                      className="profile-edit-icon-btn"
                      onClick={handleStartEditName}
                      aria-label="Upravit jméno"
                      title="Upravit jméno"
                    >
                      <FiEdit2 />
                    </button>
                  )}
                </div>

                {!isEditingName ? (
                  <strong className="profile-info-value">{profile.userName || "—"}</strong>
                ) : (
                  <form
                    className="profile-inline-name-form"
                    onSubmit={handleSubmitName}
                    noValidate
                  >
                    <input
                      type="text"
                      value={nameValue}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Zadej nové jméno"
                      className="profile-inline-name-input"
                    />

                    {nameError && <p className="profile-field-error">{nameError}</p>}

                    <div className="profile-inline-name-actions">
                      <button
                        className="btn-primary profile-inline-save-btn"
                        type="submit"
                        disabled={isSavingName}
                      >
                        {isSavingName ? "Ukládám..." : "Uložit"}
                      </button>

                      <button
                        type="button"
                        className="btn-secondary profile-inline-cancel-btn"
                        onClick={handleCancelEditName}
                        disabled={isSavingName}
                      >
                        Zrušit
                      </button>
                    </div>
                  </form>
                )}

                {nameMessage.text && (
                  <div
                    className={
                      nameMessage.type === "success"
                        ? "profile-form-message success"
                        : "profile-form-message error"
                    }
                  >
                    {nameMessage.text}
                  </div>
                )}
              </div>

              <div className="profile-info-row">
                <span className="profile-info-label">Email</span>
                <strong className="profile-info-value">{profile.email || "—"}</strong>
              </div>

              <div className="profile-info-row">
                <span className="profile-info-label">Členem od</span>
                <strong className="profile-info-value">
                  {profile.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("cs-CZ", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })
                    : "—"}
                </strong>
              </div>
            </div>
          </section>

          {profile.authProvider === "google" ? (
            <section className="profile-card">
              <div className="profile-card-header">
                <h2>Heslo</h2>
                <p className="profile-password-hint">
                  Tento účet je přihlášen prostřednictvím Google.
                </p>
              </div>

              <div className="profile-info-message">
                Heslo není spravováno touto aplikací, ale externím poskytovatelem.
                Změnu hesla je možné provést přímo v nastavení účtu Google.
              </div>
            </section>
          ) : (
            <section className="profile-card">
              <div className="profile-card-header">
                <h2>Heslo</h2>
                <p className="profile-password-hint">
                  Heslo musí mít alespoň 6 znaků, obsahovat velké písmeno a
                  číslici nebo speciální znak
                </p>
              </div>

              <form
                className="profile-password-form"
                onSubmit={isCodeSent ? handleSubmitPassword : handleRequestPasswordCode}
                noValidate
              >
                <div className="profile-form-group">
                  <label>Aktuální heslo</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        handlePasswordChange("currentPassword", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility("current")}
                    >
                      {showPassword.current ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {fieldErrors.currentPassword && (
                    <p className="profile-field-error">{fieldErrors.currentPassword}</p>
                  )}
                </div>

                <div className="profile-form-group">
                  <label>Nové heslo</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        handlePasswordChange("newPassword", e.target.value)
                      }
                      onCopy={preventCopy}
                      onCut={preventCopy}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility("new")}
                    >
                      {showPassword.new ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>

                  {fieldErrors.newPassword && (
                    <p className="profile-field-error">{fieldErrors.newPassword}</p>
                  )}

                  {passwordData.newPassword && (
                    <div className="profile-password-strength">
                      <div className="profile-password-strength-bars">
                        <span className={`strength-bar ${passwordStrength.score >= 1 ? passwordStrength.className : ""}`}></span>
                        <span className={`strength-bar ${passwordStrength.score >= 2 ? passwordStrength.className : ""}`}></span>
                        <span className={`strength-bar ${passwordStrength.score >= 3 ? passwordStrength.className : ""}`}></span>
                        <span className={`strength-bar ${passwordStrength.score >= 4 ? passwordStrength.className : ""}`}></span>
                        <span className={`strength-bar ${passwordStrength.score >= 5 ? passwordStrength.className : ""}`}></span>
                      </div>

                      <span className={`profile-password-strength-label ${passwordStrength.className}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="profile-form-group">
                  <label>Potvrzení nového hesla</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        handlePasswordChange("confirmPassword", e.target.value)
                      }
                      onPaste={preventPaste}
                      onDrop={preventPaste}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility("confirm")}
                    >
                      {showPassword.confirm ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>

                  {fieldErrors.confirmPassword && (
                    <p className="profile-field-error">{fieldErrors.confirmPassword}</p>
                  )}
                </div>

                {isCodeSent && (
                  <div className="profile-form-group">
                    <label>Ověřovací kód z e-mailu</label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        setVerificationCode(e.target.value);
                        setCodeError("");
                        setFormMessage({ type: "", text: "" });
                      }}
                      placeholder="Zadejte 6místný kód"
                      maxLength={6}
                      inputMode="numeric"
                    />

                    {codeError && (
                      <p className="profile-field-error">{codeError}</p>
                    )}
                  </div>
                )}

                {formMessage.text && (
                  <div
                    className={
                      formMessage.type === "success"
                        ? "profile-form-message success"
                        : "profile-form-message error"
                    }
                  >
                    {formMessage.text}
                  </div>
                )}

                <button className="btn-primary" type="submit" disabled={isSavingPassword}>
                  {isSavingPassword
                    ? "Probíhá zpracování..."
                    : isCodeSent
                      ? "Potvrdit změnu hesla"
                      : "Poslat ověřovací kód"}
                </button>
              </form>
            </section>
          )}
        </div>

        <section className="profile-card">
          <div className="profile-card-header">
            <h2>Váš cestovatelský přehled</h2>
            <p>Zde jsou vaše statiky</p>
          </div>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-label">Celkem výletů</span>
              <strong className="profile-stat-value">{stats.totalTrips}</strong>
            </div>

            <div className="profile-stat">
              <span className="profile-stat-label">Naplánované výlety</span>
              <strong className="profile-stat-value">{stats.activeTrips}</strong>
            </div>

            <div className="profile-stat">
              <span className="profile-stat-label">Proběhlé výlety</span>
              <strong className="profile-stat-value">{stats.completedTrips}</strong>
            </div>

            <div className="profile-stat">
              <span className="profile-stat-label">Navštívené země</span>
              <strong className="profile-stat-value">{stats.visitedCountries}</strong>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

export default Profile;
