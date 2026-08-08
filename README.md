# EduTransit SaaS — School Transport Management System

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

A modern, high-performance, centralized **School Fleet & Operations Management Platform** designed for educational institutions, multi-campus transport networks, and fleet managers. Built using **100% pure Vanilla HTML5, CSS3, and ES6 JavaScript**, enhanced with a premium SaaS-grade **motion and micro-interaction layer**.

---

## 🌟 Executive Overview

EduTransit SaaS provides complete operational control over campus bus fleets, driver compliance, routes, trip scheduling, financial collections, and maintenance alerts. 

It features dynamic multi-campus scopes, role-based access control (Super Admin, Admin, and School Panel roles), and real-time executive analytics—all within a fast, responsive Single-Page Application (SPA) architecture.

---

## ✨ Key Platform Features

- **🚌 Vehicle Fleet Management**: Complete bus directory tracking vehicle specifications, capacities, status (Active, Maintenance, Inactive), and campus assignments.
- **🆔 Driver & Staff Directory**: Manage driver profiles, mobile contacts, license verification numbers, and license expiry monitoring.
- **🛣️ Routes & Stops Management**: Route planning, start/end stop locations, assigned buses, and student capacities.
- **⏱️ Trip Dispatch & Tracking**: Real-time trip logging, schedules, driver assignments, and status tracking.
- **💰 Financial Income & Expense Analytics**: Gross revenue collection tracking, operational expenses, net campus profit calculations, and automated Indian Currency (`₹`) formatting.
- **🔔 Compliance & Renewal Warnings**: Automated tracking of vehicle insurance, fitness certificates, permit renewals, and pollution certificates with dynamic countdown urgency badges (`Expired`, `Due Today`, `<10 Days`, `<30 Days`).
- **📊 Analytics & Executive Reports**: Executive system summaries, campus performance comparison tables, Chart.js visual financial & fleet distribution analytics, and instant CSV report exports.
- **🔐 Multi-Role Access Control**: 
  - **Super Admin**: Complete control across all schools, custom role permissions matrix, system data reset.
  - **Admin**: Multi-school operational oversight.
  - **School Panel**: Campus-scoped view restricted to assigned school fleet and finances.

---

## 🎨 Motion Design & Micro-Interactions

The application incorporates a **GPU-accelerated Motion Engine (`js/motion.js`)** providing fluid micro-feedbacks while maintaining 100% UI recognition:

- **Page Transitions**: Smooth vertical translation (`translateY(12px) scale(0.995)`) and cubic-bezier opacity fade (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Staggered Entrances**: Staggered animation delays auto-assigned to metric cards, chart panels, tables, and rows.
- **Animated Count-Up Counters**: Metric totals and currency figures count up dynamically using `requestAnimationFrame` with `easeOutExpo` easing over 750ms.
- **Metric Card Elevations**: Subtle hover lift (`translateY(-4px)`), dynamic shadow expansion, and micro-scaling rotation on icon boxes (`scale(1.12)`).
- **Click Ripples & Press Feedback**: Material-style spring ripples on primary/secondary buttons, nav items, demo pills, and icon buttons.
- **Unified Button Architecture**: Matching height, `10px` border radius, padding, and typography across all Save, Cancel, and Action buttons.
- **Input Micro-Interactions**: Smooth focus ring expansion (`box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15)`), label focus states, and input icon scale shifts.
- **Modal Dialogs & Dropdowns**: Glassmorphism backdrop blur (`backdrop-filter: blur(6px)`), spring scale pop-in, notification bell wiggle keyframe (`bellWiggle`), and soft alert badge glowing pulses.
- **Toast Notifications**: Slide-in spring bounce (`toastEntrance`), auto-dismiss timer progress bar, and smooth exit slide-out.
- **Accessibility (`prefers-reduced-motion`)**: Full `@media (prefers-reduced-motion: reduce)` support to suppress non-essential animations for users preferring reduced motion.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Markup** | HTML5 Semantic Elements |
| **Styling** | Vanilla CSS3, Custom CSS Variables, Flexbox, CSS Grid, GPU Keyframe Animations |
| **Scripting** | Vanilla ES6 JavaScript (No React, Vue, Angular, or Node server frameworks) |
| **Data & State** | Client-Side State Engine (`window.db`) with LocalStorage Persistence |
| **Charts** | Chart.js 4.x CDN (Animated Bar & Doughnut Visualizations) |
| **Icons & Typography** | FontAwesome 6.4 Free, Google Fonts (Inter) |
| **Deployment** | Vercel Static Hosting (`vercel.json`) |

---

## 🔑 Quick Demo Logins

| Role | Username | Password | Access Scope |
|---|---|---|---|
| **Super Admin** | `superadmin` | `super123` | Full System Control (All Schools & Settings) |
| **Admin** | `admin` | `admin123` | Multi-School Operations |
| **School 1** | `school1` | `school123` | Scope Restricted: Green Valley Public School |
| **School 2** | `school2` | `school123` | Scope Restricted: St. Mary's Higher Secondary School |

*(Autofill demo credentials buttons are available directly on the login screen).*

---

## 📁 File Structure

```text
transport-management/
├── index.html            # Main HTML layout & modal dialog templates
├── vercel.json           # Vercel static deployment configuration
├── README.md             # Project documentation & summary
├── css/
│   └── style.css         # Complete design system & motion keyframe styles
└── js/
    ├── data.js           # Prototype seed database & LocalStorage state manager
    ├── utils.js          # Currency formatters, date math, modal & toast helpers
    ├── motion.js         # Motion Engine (counters, ripples, staggered entrances)
    ├── auth.js           # Session authentication & role permission checker
    ├── dashboard.js      # Global & School-scoped dashboard renderer + Chart.js
    ├── schools.js        # Schools management module
    ├── vehicles.js       # Vehicles fleet management module
    ├── drivers.js        # Drivers directory module
    ├── routes.js         # Routes & stops planning module
    ├── trips.js          # Trip dispatch module
    ├── income.js         # Income & revenue tracking module
    ├── expenses.js       # Operational expense tracking module
    ├── renewals.js       # Vehicle compliance & renewal alerts module
    ├── reports.js        # Executive reports & CSV export engine
    └── app.js            # Main SPA router & event controller
```

---

## 🚀 Local Setup & Vercel Deployment

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/Adarsh1530/transport-management.git
   cd transport-management
   ```
2. Serve static files with any local HTTP server (or open `index.html` directly in your browser):
   ```bash
   npx serve -l 3000
   ```

### Deploy to Vercel
1. Import repository on [Vercel](https://vercel.com/new).
2. Vercel automatically detects `vercel.json` and deploys your site live instantly with free HTTPS!

---

© 2026 EduTransit SaaS — School Transport Management System.