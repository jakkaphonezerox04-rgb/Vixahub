"use client"
import { useState, useEffect } from "react"
import {
  Users,
  FolderOpen,
  CheckSquare,
  TrendingUp,
  Calendar,
  MessageSquare,
  Activity,
  Clock,
  Award,
} from "lucide-react"

export default function DashboardContent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const stats = [
    {
      title: "Total Members",
      value: "24",
      change: "+12%",
      changeType: "positive",
      icon: Users,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Active Projects",
      value: "8",
      change: "+3",
      changeType: "positive",
      icon: FolderOpen,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Pending Tasks",
      value: "42",
      change: "-8",
      changeType: "negative",
      icon: CheckSquare,
      color: "from-yellow-500 to-yellow-600",
    },
    {
      title: "Team Performance",
      value: "94%",
      change: "+5%",
      changeType: "positive",
      icon: TrendingUp,
      color: "from-purple-500 to-purple-600",
    },
  ]

  const recentActivities = [
    {
      id: 1,
      user: "John Doe",
      action: "completed task",
      target: "Website Redesign",
      time: "2 minutes ago",
      avatar: "JD",
    },
    {
      id: 2,
      user: "Sarah Wilson",
      action: "joined project",
      target: "Mobile App Development",
      time: "15 minutes ago",
      avatar: "SW",
    },
    {
      id: 3,
      user: "Mike Johnson",
      action: "updated status",
      target: "Database Migration",
      time: "1 hour ago",
      avatar: "MJ",
    },
    {
      id: 4,
      user: "Emily Chen",
      action: "created new task",
      target: "User Testing Phase",
      time: "2 hours ago",
      avatar: "EC",
    },
  ]

  const upcomingEvents = [
    {
      id: 1,
      title: "Team Meeting",
      time: "10:00 AM",
      date: "Today",
      type: "meeting",
    },
    {
      id: 2,
      title: "Project Deadline",
      time: "11:59 PM",
      date: "Tomorrow",
      type: "deadline",
    },
    {
      id: 3,
      title: "Client Presentation",
      time: "2:00 PM",
      date: "Friday",
      type: "presentation",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div
        className={`transform transition-all duration-1000 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Admin!</h1>
              <p className="text-gray-300">Here's what's happening with your team today.</p>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transform transition-all duration-1000 delay-200 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.title}
              className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:scale-105 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded-full ${
                    stat.changeType === "positive" ? "text-green-400 bg-green-400/20" : "text-red-400 bg-red-400/20"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-gray-400 text-sm">{stat.title}</p>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transform transition-all duration-1000 delay-400 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Recent Activities</h2>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-700/30 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {activity.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-white">
                    <span className="font-medium">{activity.user}</span>{" "}
                    <span className="text-gray-400">{activity.action}</span>{" "}
                    <span className="text-purple-400">{activity.target}</span>
                  </p>
                  <p className="text-gray-500 text-sm">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
          </div>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 rounded-xl border border-gray-700/50 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium">{event.title}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      event.type === "meeting"
                        ? "bg-blue-500/20 text-blue-400"
                        : event.type === "deadline"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {event.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>
                    {event.time} • {event.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        className={`transform transition-all duration-1000 delay-600 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: "Add Member", icon: Users, color: "from-blue-500 to-blue-600" },
              { title: "New Project", icon: FolderOpen, color: "from-green-500 to-green-600" },
              { title: "Create Task", icon: CheckSquare, color: "from-yellow-500 to-yellow-600" },
              { title: "Send Message", icon: MessageSquare, color: "from-purple-500 to-purple-600" },
            ].map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.title}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-700/50 hover:border-purple-500/50 hover:scale-105 transition-all duration-300 group"
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white font-medium text-sm">{action.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
