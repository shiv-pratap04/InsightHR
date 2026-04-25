# HRInsight - Project Structure, Use Cases & Features (Hindi-English Explanation)

---

## 🎯 PROJECT OVERVIEW (प्रोजेक्ट का परिचय)

**HRInsight** ek **Intelligent Employee Management & Decision Support System** hai jo HR teams ko smart decisions lene mein madad karti hai.

### Kya Karta Hai?
- **Performance Scoring** → Employee ka performance likha jaata hai formula se
- **Smart Task Allocation** → Sahi kaam sahi employee ko automatic assign hota hai
- **Attrition Risk Detection** → Pata lagta hai kaunsa employee company chod sakta hai
- **Anomaly Detection** → Agar kisi employee ka performance suddenly drop ho jaaye
- **Promotion Recommendations** → Kaunsa employee promotion ke layak hai
- **Google OAuth Security** → Google se login with Google feature
- **Role-Based Access** → Admin, Manager, Employee - har ek ko different access

---

## 🏗️ PROJECT ARCHITECTURE (तकनीकी संरचना)

```
HRInsight/
├── client/              → Frontend (React + Vite)
├── server/              → Backend (Node.js + Express)
├── report/              → Project documentation (LaTeX)
└── README.md
```

### Frontend Stack (Client Side)
```
/client
├── React (UI Library)
├── Vite (Build Tool - fast)
├── Tailwind CSS (Styling)
├── React Router (Page Navigation)
├── React Hook Form + Zod (Form validation)
├── Recharts (Graphs/Charts)
├── Axios (API calls)
├── Zustand (State Management)
└── ShadCN UI (Pre-made components)
```

**Key Pages:**
- `/landing` → Home page
- `/login`, `/register` → Authentication
- `/admin/dashboard` → Admin dashboard
- `/manager/dashboard` → Manager dashboard
- `/employee/dashboard` → Employee dashboard
- `/employees` → Employee list
- `/tasks` → Task management
- `/performance` → Performance analytics
- `/attrition` → Attrition prediction
- `/promotion` → Promotion recommendations
- `/alerts` → System alerts
- `/settings` → Configurable weights

### Backend Stack (Server Side)
```
/server
├── Node.js + Express.js (Web framework)
├── MongoDB + Mongoose (Database)
├── Passport.js (Google OAuth 2.0)
├── JWT (Authentication in HTTP-only cookies)
├── Bcrypt (Password encryption)
├── Helmet (Security headers)
├── CORS (Cross-origin requests)
├── Morgan (HTTP logging)
└── Validation middleware
```

---

## 💾 DATABASE MODELS (डेटा स्ट्रक्चर)

### 1. **User Model**
```javascript
{
  _id: ObjectId,
  email: String,
  password: String (bcrypt hash),
  role: 'admin' | 'manager' | 'employee',
  employeeId: ObjectId,
  googleId: String (optional),
  createdAt: Date
}
```
**Use:** Login/Signup ke liye

---

### 2. **Employee Model**
```javascript
{
  _id: ObjectId,
  fullName: String,
  department: String,
  designation: String,
  email: String,
  phone: String,
  joiningDate: Date,
  
  // Performance Metrics
  attendanceRate: Number (0-100),
  taskCompletionRate: Number (0-100),
  deadlineAdherenceRate: Number (0-100),
  peerFeedbackScore: Number (0-100),
  engagementScore: Number (0-100),
  
  // Workload
  currentWorkload: Number (0-100),
  
  // Skills & Experience
  skills: [String],
  experienceYears: Number,
  
  // Financial
  salary: Number,
  
  // Career
  lastPromotionDate: Date,
  promotionScore: Number (0-100),
  
  // Status
  status: 'active' | 'inactive',
  
  // Performance History (computed)
  performanceHistory: [{ weightedScore, date }],
  
  createdAt: Date
}
```
**Use:** Employee info store karte hain

---

### 3. **Task Model**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  department: String,
  
  // Skills requirement
  requiredSkills: [String],
  
  // Assignment
  assignedTo: ObjectId (Employee reference),
  createdBy: ObjectId (Manager reference),
  
  // Status tracking
  status: 'pending' | 'assigned' | 'in-progress' | 'completed',
  
  // Dates
  deadline: Date,
  completedAt: Date,
  
  // Priority
  priority: 'low' | 'medium' | 'high',
  
  createdAt: Date
}
```
**Use:** Task management ke liye

---

### 4. **PerformanceRecord Model**
```javascript
{
  _id: ObjectId,
  employeeId: ObjectId,
  
  // Raw scores
  attendanceScore: Number (0-100),
  taskCompletionScore: Number (0-100),
  deadlineAdherenceScore: Number (0-100),
  peerFeedbackScore: Number (0-100),
  
  // Weighted score
  weightedScore: Number (0-100),
  
  // Breakdown explanation
  breakdown: {
    weights: { w1, w2, w3, w4 },      // Weights used
    contributions: { ... },             // Each component's contribution
    explanation: String,                // Human readable
    defaultsUsed: [String]
  },
  
  createdAt: Date
}
```
**Use:** Performance history record ke liye

---

### 5. **Alert Model**
```javascript
{
  _id: ObjectId,
  employeeId: ObjectId,
  type: String ('attrition_risk' | 'anomaly' | 'promotion_ready'),
  severity: 'low' | 'medium' | 'high',
  message: String,
  read: Boolean,
  createdAt: Date
}
```
**Use:** System alerts show karte hain

---

## 🧮 FORMULAS & ALGORITHMS (महत्वपूर्ण सूत्र)

---

### 1️⃣ PERFORMANCE SCORE CALCULATION (सबसे महत्वपूर्ण formula)

**Formula:**
```
Weighted Score = w1×Attendance + w2×TaskCompletion + w3×DeadlineAdherence + w4×PeerFeedback
```

Where:
- `w1, w2, w3, w4` = Configurable weights (admin se set ho sakte hain)
- Each component = 0 to 100 scale
- **Default weights** (can be changed in settings):
  - w1 (Attendance) = 0.25
  - w2 (Task Completion) = 0.35
  - w3 (Deadline Adherence) = 0.25
  - w4 (Peer Feedback) = 0.15

**Example:**
```
Attendance = 85
Task Completion = 90
Deadline Adherence = 80
Peer Feedback = 75

Weighted Score = 0.25×85 + 0.35×90 + 0.25×80 + 0.15×75
               = 21.25 + 31.5 + 20 + 11.25
               = 84 (out of 100)
```

**Code location:** [server/src/services/performanceEngine.js](server/src/services/performanceEngine.js)

---

### 2️⃣ ATTRITION RISK SCORING (Employee kab chodega pata lagana)

**Algorithm:** Rule-based additive model

**Formula:**
```
Attrition Risk Score = Sum of individual risk factors (capped at 100)
```

**Risk Factors:**

| Factor | Condition | Score Added | Explanation |
|--------|-----------|-------------|-------------|
| **Attendance** | < 75% | +18 | Disengagement ka signal |
| **Workload** | > 85% | +20 | Overload से burnout |
| **Performance Trend** | Drop > 8 points | +22 | Performance declining |
| **Salary Equity** | < 88% of dept avg | +15 | Underpaid feel karega |
| **Engagement** | < 45 score | +12 | Low motivation |
| **Promotion Lag** | > 36 months + high readiness | +10 | Frustrated rahega |

**Risk Levels:**
```
Score >= 65  → HIGH RISK     (लाल)
Score 40-64  → MEDIUM RISK   (पीला)
Score < 40   → LOW RISK      (हरा)
```

**Example:**
```
Employee: Raj
- Attendance: 70% → +18
- Workload: 88% → +20
- Performance Trend: Down 10 points → +22
- Salary: 80% of avg → +15

Total = 18+20+22+15 = 75 → HIGH RISK ⚠️
```

**Code location:** [server/src/services/attritionService.js](server/src/services/attritionService.js)

---

### 3️⃣ TASK ALLOCATION ALGORITHM (सही employee को task assign करना)

**Formula for Final Match Score:**
```
Final Match Score = Skill Match + Availability - Workload Penalty
```

**Components:**

#### A. Skill Match Score
```
Skill Match = (Matched Skills / Total Required Skills) × 100
```
- If task requires ["Python", "React", "Docker"]
- Employee has ["Python", "Docker"]
- Match = (2/3) × 100 = 66.67%

#### B. Availability Score
```
Availability = 100 - Current Workload
```
- If workload = 40%, Availability = 60%
- If workload = 85%, Availability = 15%

#### C. Workload Penalty
```
Workload Penalty = (Current Workload × 0.35) + (Active Tasks Count × 8)
Penalty = Min(80, Penalty)  // Capped at 80
```
- This prevents overloading employees

#### Final Calculation:
```
Match Score = Skill Match + Availability - Workload Penalty
```

**Example:**
```
Task Required: ["Python", "Database Design"]
Employee: Raj

1. Skills:
   - Raj has ["Python", "Docker"]
   - Match = (1/2) × 100 = 50%

2. Availability:
   - Current Workload = 45%
   - Availability = 100 - 45 = 55%

3. Workload Penalty:
   - Active tasks = 2
   - Penalty = (45 × 0.35) + (2 × 8) = 15.75 + 16 = 31.75

4. Final Score:
   - 50 + 55 - 31.75 = 73.25/100

✅ Raj suitable hai is task ke liye!
```

**Output:** Top 3 recommendations with detailed explanation

**Code location:** [server/src/services/taskAllocationService.js](server/src/services/taskAllocationService.js)

---

### 4️⃣ ANOMALY DETECTION (असामान्य प्रदर्शन का पता लगाना)

**Method 1: Z-Score Detection (Performance)**
```
Z-Score = (Current Score - Mean) / Standard Deviation

If Z < -2   → HIGH severity anomaly
If Z < -1.5 → MEDIUM severity anomaly
```

**Formula for Mean & Standard Deviation:**
```
Mean (μ) = (x₁ + x₂ + ... + xₙ) / n

Standard Deviation (σ) = √[Σ(xᵢ - μ)² / n]
```

**Example:**
```
Last 6 months performance: [82, 85, 83, 81, 78, 60]

Mean = (82+85+83+81+78+60) / 6 = 469/6 = 78.17

Variance = [(82-78.17)² + (85-78.17)² + ... + (60-78.17)²] / 6
         = 35.67

Std Dev (σ) = √35.67 = 5.97

Latest score = 60
Z = (60 - 78.17) / 5.97 = -18.17 / 5.97 = -3.04

Z < -2 → HIGH ANOMALY! 🚨
```

**Method 2: Attendance Drop Rule**
```
If Current Attendance - Previous Attendance < -15%
  → MEDIUM severity anomaly

If drop < -25%
  → HIGH severity anomaly
```

**Method 3: Task Completion Irregularity**
```
Variance = Average absolute change between consecutive records

If Variance > 25
  → Inconsistent performance (task completion)
```

**Code location:** [server/src/services/anomalyService.js](server/src/services/anomalyService.js)

---

### 5️⃣ PROMOTION READINESS SCORE (प्रमोशन के लिए तैयार?)

**Formula:** Multi-factor scoring model

**Scoring Factors:**

| Factor | Condition | Points | Weight |
|--------|-----------|--------|--------|
| **Latest Performance** | ≥82 | +30 | Strong |
| | 72-81 | +20 | Solid |
| | <72 | +0 | Weak |
| **Trend (6-month window)** | Improving (>5 pts) | +20 | Good sign |
| | Declining (<-5 pts) | -10 | Concern |
| **Peer Feedback** | ≥80 | +15 | Leadership quality |
| **Attendance** | ≥90% | +15 | Consistent |
| | <75% | -8 | Unreliable |
| **Skill Breadth** | ≥5 skills | +10 | Capable |
| **Tenure** | ≥3 years | +10 | Experienced |

**Trend Calculation:**
```
Recent Avg = Average of last 3 performance records
Older Avg = Average of 3 months before that

Trend = Recent Avg - Older Avg
```

**Final Score:**
```
Promotion Score = Sum of qualifying factors (0 to 100)
```

**Example:**
```
Employee: Priya

Latest Performance: 84 → +30
Trend: +7 pts (improving) → +20
Peer Feedback: 82 → +15
Attendance: 92% → +15
Skills: 6 → +10
Tenure: 4 years → +10

Total = 30+20+15+15+10+10 = 100 → EXCELLENT for promotion! 🎉
```

**Code location:** [server/src/services/promotionService.js](server/src/services/promotionService.js)

---

### 6️⃣ PERFORMANCE TREND ANALYSIS (Performance better ya worse ja raha hai?)

**Formula:**
```
Trend Score = Recent Average - Older Average

Recent = Average of last 3 performance records
Older = Average of 3 records before that
```

**Interpretation:**
```
Trend Score = +10 → Improving significantly ⬆️ (Good!)
Trend Score = +2  → Slightly improving ↗️
Trend Score = 0   → Stable ➡️
Trend Score = -5  → Declining ↘️ (Concerning)
Trend Score = -12 → Sharp decline ⬇️ (Alert!)
```

**Code location:** [server/src/services/attritionService.js](server/src/services/attritionService.js#L7-L18)

---

## 🔐 AUTHENTICATION FLOW (लॉगिन कैसे काम करता है)

```
┌─────────────────────────────────────────────────────┐
│                  USER LOGIN FLOW                     │
└─────────────────────────────────────────────────────┘

1. USER ENTERS CREDENTIALS
   ↓
2. POST /api/auth/login
   - Email & Password भेजा जाता है
   ↓
3. SERVER CHECK
   - MongoDB मे employee ढूंढो
   - bcrypt से password verify करो
   ↓
4. JWT TOKEN GENERATE
   - Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ↓
5. SET HTTP-ONLY COOKIE
   - Cookie मे token store होता है (secure ✅)
   - JavaScript access नहीं कर सकता (XSS attack से बचाव)
   ↓
6. REDIRECT TO DASHBOARD
   - Admin → /admin/dashboard
   - Manager → /manager/dashboard
   - Employee → /employee/dashboard
```

**Google OAuth Flow:**
```
1. User clicks "Login with Google"
   ↓
2. Redirect to Google OAuth Consent Screen
   ↓
3. User grants permission
   ↓
4. Google returns authorization code
   ↓
5. Server exchanges code for Google profile
   ↓
6. Check if user exists in MongoDB
   - YES → Login करो
   - NO → Auto-register करो
   ↓
7. Generate JWT token & set cookie
   ↓
8. Redirect to dashboard
```

---

## 🎯 USE CASES (असली दुनिया के उदाहरण)

### Use Case 1: HR Manager को Employee Performance देखना है
```
Scenario: Manager चाहता है कि पिछले 6 महीने में किसका performance
          सबसे अच्छा है?

Steps:
1. Manager login करता है
2. /performance page खोलता है
3. Charts से देखता है सभी employees की performance
4. Weighted scores compare करता है
5. Performance Engine से formula के through:
   - Attendance (25%)
   - Task Completion (35%)
   - Deadline Adherence (25%)
   - Peer Feedback (15%)
6. Recommendation मिलती है किसको salary review/bonus देना चाहिए
```

---

### Use Case 2: Attrition Risk Alert
```
Scenario: HR को warning मिलती है कि कोई employee छोड़ने वाला है

Steps:
1. System automatically चलाता है attrition prediction
2. Employee की metrics check करता है:
   - Attendance: 70% (LOW) → +18 points
   - Workload: 90% (HIGH) → +20 points
   - Performance Trend: Declining → +22 points
   - Salary: 80% of industry avg → +15 points
   
3. Total Score = 75 (HIGH RISK)
4. Alert generate होता है:
   🚨 ALERT: Raj क्या छोड़ने वाला है!
   
5. Suggested Actions:
   - Salary review करो
   - 1:1 meeting लो
   - Mentoring प्रदान करो
   - Workload reduce करो

6. HR एक्शन ले सकता है time रहते
```

---

### Use Case 3: Task Allocation
```
Scenario: नया project assign करना है

Task Details:
- Required Skills: ["Python", "MongoDB", "React"]
- Priority: High
- Deadline: 2 days

System Check करता है सभी employees के लिए:

Employee: Raj
- Skills: Python, MongoDB, Docker (2/3 matched = 66.67%)
- Workload: 45%
- Active Tasks: 2

Score:
- Skill Match: 66.67
- Availability: 55
- Penalty: (45×0.35) + (2×8) = 31.75
- Final: 66.67 + 55 - 31.75 = 89.92 ✅

Employee: Priya
- Skills: Python, React, Django (2/3 matched = 66.67%)
- Workload: 20%
- Active Tasks: 1

Score:
- Skill Match: 66.67
- Availability: 80
- Penalty: (20×0.35) + (1×8) = 15
- Final: 66.67 + 80 - 15 = 131.67 ✅✅✅

RANKING
1. Priya (131.67) ← RECOMMEND करो
2. Raj (89.92)
3. Others...

System suggest करता है Priya को task दो
```

---

### Use Case 4: Promotion Recommendation
```
Scenario: Company मे 2 promotions available हैं

Employee 1: Vikram
- Latest Performance: 88 → +30
- Trend: +8 (improving) → +20
- Peer Feedback: 85 → +15
- Attendance: 95% → +15
- Skills: 7 → +10
- Tenure: 5 years → +10
- Total Score: 100

Employee 2: Neha
- Latest Performance: 75 → +20
- Trend: -3 (declining) → +0
- Peer Feedback: 70 → +0
- Attendance: 85% → +0
- Skills: 4 → +0
- Tenure: 2 years → +0
- Total Score: 20

RECOMMENDATION:
1. Vikram (100) → PROMOTE करो! 🎯
2. Neha (20) → More support दो, फिर देखेंगे
```

---

### Use Case 5: Anomaly Detection Alert
```
Scenario: Employee का performance अचानक ख़राब हो गया

Historical Data (last 6 months):
[82, 85, 83, 81, 78, 60]

Analysis:
- Mean = 78.17
- Std Dev = 5.97
- Latest Score = 60
- Z-Score = (60-78.17)/5.97 = -3.04

Z < -2 → HIGH ANOMALY DETECTED! 🚨

Alert Message:
"Raj का performance suddenly drop हो गया है!
 Latest score 60, तो उसका typical 78-85 होता है।
 
 संभावित कारण:
 - Personal problems
 - Health issues
 - Workload too high
 - Skill gaps
 
 Action:
 - 1:1 meeting लो
 - Support offer करो
 - Mentoring advise करो"
```

---

## 📊 DASHBOARD FEATURES (अलग-अलग roles के लिए)

### Admin Dashboard
```
- All employees की performance overview
- Department-wise analytics
- Salary distribution charts
- Attrition trends
- System configuration (weights change कर सकता है)
- Alert management
```

### Manager Dashboard
```
- Team का performance
- Task allocation status
- Team member attrition risks
- Leave/attendance tracking
- Performance trends
```

### Employee Dashboard
```
- Personal performance score
- Task list (assigned, in-progress, completed)
- Performance history (last 6 months)
- Promotion readiness (अगर eligible है)
- Personal metrics breakdown
```

---

## 🔌 API ENDPOINTS SUMMARY

### Authentication
```
POST   /api/auth/register          → नया account बनाना
POST   /api/auth/login             → Login करना
GET    /api/auth/google            → Google OAuth start
GET    /api/auth/google/callback   → Google callback
POST   /api/auth/logout            → Logout करना
GET    /api/auth/me                → Current user info
```

### Employees
```
GET    /api/employees              → सभी employees list
GET    /api/employees/:id          → Single employee details
POST   /api/employees              → नया employee add करना
PUT    /api/employees/:id          → Employee update करना
DELETE /api/employees/:id          → Employee delete करना
```

### Tasks
```
GET    /api/tasks                  → सभी tasks
POST   /api/tasks                  → नया task create करना
PUT    /api/tasks/:id              → Task update करना
POST   /api/tasks/:id/assign       → Task किसी को assign करना
GET    /api/tasks/recommend/:taskId → Smart allocation recommendation
```

### Performance
```
POST   /api/performance/calculate  → Performance score निकालना
GET    /api/performance/:employeeId → Employee ka performance
GET    /api/performance/trends/:employeeId → 6-month trends
```

### Analytics (ML Routes)
```
POST   /api/ml/attrition           → Attrition risk prediction
POST   /api/ml/anomaly             → Anomaly detection
POST   /api/ml/promotion           → Promotion readiness
POST   /api/ml/task-match          → Task allocation scoring
```

### Alerts
```
GET    /api/alerts                 → सभी alerts
PUT    /api/alerts/:id/read        → Alert को read mark करना
```

### Settings
```
GET    /api/settings/weights       → Current weights देखना
PUT    /api/settings/weights       → Weights change करना (admin)
```

---

## 🎓 IMPORTANT CONCEPTS (याद रखने वाली चीज़ें)

### 1. **Explainability** (समझ आना चाहिए)
```
हर calculation के साथ explanation होता है:

Bad: Score = 85
Good: Score = 85 (Attendance 25%, Task Completion 35% से बढ़ा है,
                    लेकिन Peer Feedback कम है)
```

### 2. **Rule-Based Models** (ML की जगह rules)
```
- No machine learning library required
- Transparent decisions (admin समझ सकता है)
- Easy to audit और modify
- Production-ready
```

### 3. **Weighted Scoring**
```
Different components को different importance देते हैं:
- Task completion (35%) सबसे important
- Attendance (25%) important
- Deadline adherence (25%) important
- Peer feedback (15%) support देता है
```

### 4. **Statistical Methods**
```
Z-Score anomaly detection statistical approach है:
- Historical data से mean & std deviation निकालते हैं
- Current values को compare करते हैं
- Outliers identify करते हैं
```

### 5. **Multi-factor Decision Making**
```
कोई भी decision एक ही metric पर नहीं होता:
- Promotion = Performance + Trend + Attendance + Skills + Tenure
- Task Allocation = Skills + Availability - Workload
- Attrition = Attendance + Workload + Trend + Salary + Engagement
```

---

## 🚀 TECHNICAL FLOW

### Request-Response Cycle
```
1. FRONTEND (React)
   - User action (button click)
   ↓
2. API CALL (Axios)
   - POST /api/ml/attrition
   - Body: { employeeId: "123" }
   ↓
3. BACKEND (Express)
   - Route handler में jाता है
   - Middleware: auth verify, validate
   ↓
4. SERVICE LAYER (Business Logic)
   - Database से employee fetch करता है
   - Formula apply करता है
   - Calculations करता है
   ↓
5. MONGODB
   - Employee document return करता है
   ↓
6. RESPONSE
   - JSON with {
       riskLevel: "High",
       riskScore: 75,
       reasons: [...],
       recommendedActions: [...],
       explanation: "..."
     }
   ↓
7. FRONTEND
   - Data को format करता है
   - User को दिखाता है
```

---

## 📱 UI/UX Features

### Responsive Design
- Desktop: Full dashboard with charts
- Tablet: Responsive layout
- Mobile: Essential features only

### Real-time Updates
- Alert notifications
- Performance chart updates
- Task status changes

### Data Visualization
- Line charts (performance trends)
- Bar charts (department comparison)
- Pie charts (skill distribution)
- Color-coded alerts (red=high, yellow=medium, green=low)

---

## 🔒 Security Features (सुरक्षा)

1. **Password Encryption** → bcrypt से hash
2. **JWT Tokens** → HTTP-only cookies में
3. **CORS** → Frontend से ही request allow
4. **Helmet Middleware** → Security headers add करता है
5. **Role-Based Access Control** → Admin/Manager/Employee
6. **Validation** → Input data को verify करता है

---

## 📈 SCALING OPPORTUNITIES (भविष्य में क्या करो)

1. Python-based ML models integrate कर सकते हो
2. Real-time WebSocket updates (Socket.io)
3. Advanced analytics (Tableau/PowerBI)
4. Predictive models (Decision Tree, Random Forest)
5. Recommendation engine (Collaborative filtering)
6. Mobile app (React Native)
7. Microservices architecture
8. Data warehouse (BigQuery)

---

## 🎯 FINAL SUMMARY

**HRInsight** एक complete HR solution है जो:

✅ **Automates** - Manual HR tasks
✅ **Predicts** - Attrition और anomalies
✅ **Recommends** - Promotions और task allocation
✅ **Explains** - हर decision के साथ reasoning
✅ **Secures** - Google OAuth + JWT
✅ **Scales** - Modern tech stack

**Key Takeaways for Your Instructor:**

1. **Architecture** - Scalable microservices-ready design
2. **Algorithms** - Multi-factor scoring with statistical methods
3. **Security** - Enterprise-grade authentication
4. **UI/UX** - Modern, responsive interface
5. **Explainability** - Transparent decision-making

---

**Created:** April 22, 2026
**Stack:** MERN (MongoDB, Express, React, Node.js)
**Purpose:** Educational + Production-Ready Demo

Good luck with your presentation! 🎓
