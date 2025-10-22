"use client"
import { useState, useEffect } from "react"
import { Settings, Bell, Shield, Palette, Save, X } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function SettingsPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [hasChanges, setHasChanges] = useState(false)
  const { language, setLanguage, t } = useLanguage()

  const [settings, setSettings] = useState({
    // General Settings
    language: language,
    timezone: "Asia/Bangkok",
    dateFormat: "DD/MM/YYYY",

    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,

    // Security Settings
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: "30",

    // Appearance Settings
    theme: "dark",
    fontSize: "medium",
    compactMode: false,
  })

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
    setHasChanges(true)
    
    // Handle language change immediately
    if (key === "language") {
      setLanguage(value)
    }
  }

  const handleSave = () => {
    console.log("Saving settings:", settings)
    setHasChanges(false)
    // Here you would typically save to backend
  }

  const handleReset = () => {
    // Reset to original values
    setHasChanges(false)
  }

  const tabs = [
    { id: "general", label: t("general"), icon: Settings },
    { id: "notifications", label: t("notifications"), icon: Bell },
    { id: "security", label: t("security"), icon: Shield },
    { id: "appearance", label: t("appearance"), icon: Palette },
  ]

  return (
    <div className="space-y-6">


      {/* Settings Content */}
      <div
        className={`transform transition-all duration-1000 delay-200 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border border-purple-500/30"
                          : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-purple-400" : "text-gray-400"}`} />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
              {/* General Settings */}
              {activeTab === "general" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">{t("generalSettings")}</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">{t("language")}</label>
                      <select
                        value={settings.language}
                        onChange={(e) => handleSettingChange("language", e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      >
                        <option value="th">{t("thai")}</option>
                        <option value="en">{t("english")}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">{t("timezone")}</label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleSettingChange("timezone", e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      >
                        <option value="Asia/Bangkok">{t("bangkokTimezone")}</option>
                        <option value="UTC">{t("utcTimezone")}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">{t("dateFormat")}</label>
                      <select
                        value={settings.dateFormat}
                        onChange={(e) => handleSettingChange("dateFormat", e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">{t("notificationSettings")}</h2>

                  <div className="space-y-4">
                    {[
                      { key: "emailNotifications", label: t("emailNotifications"), desc: t("emailNotificationsDesc") },
                      { key: "pushNotifications", label: t("pushNotifications"), desc: t("pushNotificationsDesc") },
                      { key: "smsNotifications", label: t("smsNotifications"), desc: t("smsNotificationsDesc") },
                      { key: "marketingEmails", label: t("marketingEmails"), desc: t("marketingEmailsDesc") },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl">
                        <div>
                          <h3 className="text-white font-medium">{item.label}</h3>
                          <p className="text-gray-400 text-sm">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings[item.key as keyof typeof settings] as boolean}
                            onChange={(e) => handleSettingChange(item.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">{t("securitySettings")}</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl">
                      <div>
                        <h3 className="text-white font-medium">{t("twoFactorAuth")}</h3>
                        <p className="text-gray-400 text-sm">{t("twoFactorAuthDesc")}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.twoFactorAuth}
                          onChange={(e) => handleSettingChange("twoFactorAuth", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl">
                      <div>
                        <h3 className="text-white font-medium">{t("loginAlerts")}</h3>
                        <p className="text-gray-400 text-sm">{t("loginAlertsDesc")}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.loginAlerts}
                          onChange={(e) => handleSettingChange("loginAlerts", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">{t("sessionTimeout")}</label>
                      <select
                        value={settings.sessionTimeout}
                        onChange={(e) => handleSettingChange("sessionTimeout", e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      >
                        <option value="15">{t("fifteenMinutes")}</option>
                        <option value="30">{t("thirtyMinutes")}</option>
                        <option value="60">{t("oneHour")}</option>
                        <option value="120">{t("twoHours")}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === "appearance" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">{t("appearanceSettings")}</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">{t("theme")}</label>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { value: "dark", label: t("darkMode") },
                          { value: "light", label: t("lightMode") },
                        ].map((theme) => (
                          <button
                            key={theme.value}
                            onClick={() => handleSettingChange("theme", theme.value)}
                            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                              settings.theme === theme.value
                                ? "border-purple-500 bg-purple-600/20"
                                : "border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50"
                            }`}
                          >
                            <div
                              className={`w-full h-16 rounded-xl mb-2 ${
                                theme.value === "dark" ? "bg-gray-900" : "bg-white"
                              }`}
                            ></div>
                            <p className="text-white text-sm">{theme.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">{t("fontSize")}</label>
                      <select
                        value={settings.fontSize}
                        onChange={(e) => handleSettingChange("fontSize", e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      >
                        <option value="small">{t("small")}</option>
                        <option value="medium">{t("medium")}</option>
                        <option value="large">{t("large")}</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl">
                      <div>
                        <h3 className="text-white font-medium">{t("compactMode")}</h3>
                        <p className="text-gray-400 text-sm">{t("compactModeDesc")}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.compactMode}
                          onChange={(e) => handleSettingChange("compactMode", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
