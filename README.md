# 🌱 Phro Kla (เพราะกล้า) - Seedling Management System

"เพราะกล้า" คือระบบเว็บแอปพลิเคชันสำหรับบริหารจัดการโครงการเพาะชำและปลูกต้นกล้าแบบครบวงจร สร้างขึ้นเพื่อช่วยให้ผู้ดูแลโครงการสามารถติดตามข้อมูลทั้งหมดได้อย่างมีประสิทธิภาพ ตั้งแต่การรวบรวมเมล็ดพันธุ์, การดูแลในโรงเพาะชำ, ไปจนถึงการส่งมอบให้กับเครือข่าย

## 🖥️ โครงสร้างระบบ

- **Public Dashboard (`/`)**: หน้าสรุปภาพรวมโครงการสำหรับบุคคลทั่วไป แสดงจำนวนต้นกล้า, สัดส่วนชนิด, และสถานะโครงการ
- **Admin Dashboard (`/admin`)**: ระบบหลังบ้านสำหรับผู้ดูแลโครงการ (ต้องเข้าสู่ระบบ)

---

## ✨ ฟีเจอร์หลัก

- **แดชบอร์ด (Admin Dashboard):** กราฟภาพรวม, สถิติ, แนวโน้มการเติบโต
- **จัดการข้อมูลต้นกล้า:** เพิ่ม/ลบ/แก้ไข/ค้นหา/ฟิลเตอร์
- **จัดการรุ่น/แหล่งที่มา:** บันทึกข้อมูลรุ่น, พิกัด, แหล่งที่มา
- **สมุดบันทึก (Logbook):** บันทึกกิจกรรมในโรงเพาะชำ
- **จัดการเครือข่าย (Partner):** ข้อมูลผู้รับ/เครือข่าย
- **ระบบใบคำขอ (Request Order):** สร้าง/อนุมัติ/ตัดสต็อก/พิมพ์ใบส่งมอบ
- **ติดตามสถานะโครงการ:** อัปเดตและแสดงสถานะในรูปแบบ Timeline
- **ระบบล็อกอิน/ออกจากระบบ:** เฉพาะผู้ดูแลเท่านั้นที่เข้าถึง `/admin` ได้

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Backend & Database:** [Supabase](https://supabase.io/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Data Visualization:** [Recharts](https://recharts.org/)
- **Animation:** [Framer Motion](https://www.framer.com/motion/)
- **Print:** [react-to-print](https://www.npmjs.com/package/react-to-print)

---

## 🚀 เริ่มต้นใช้งาน

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.18.0 หรือใหม่กว่า)
- `npm`, `yarn`, หรือ `pnpm`

### 1. Clone และติดตั้ง dependencies

```bash
git clone https://github.com/your-username/PhroKla.git
cd PhroKla

npm install
# หรือ
yarn install
# หรือ
pnpm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` แล้วใส่ค่า Supabase ของคุณ

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 3. รันโปรเจกต์

```bash
npm run dev
# หรือ
yarn dev
# หรือ
pnpm dev
```

เปิด [http://localhost:3000](http://localhost:3000) เพื่อดูหน้า Public Dashboard  
เปิด [http://localhost:3000/admin](http://localhost:3000/admin) เพื่อเข้าสู่ระบบหลังบ้าน (ต้อง login)

---

## 🔐 การเข้าสู่ระบบ (Admin)

- สมัครผู้ใช้ใหม่หรือเพิ่มผู้ใช้ผ่าน Supabase Auth Dashboard
- เข้าสู่ระบบที่ `/login` ด้วยอีเมลและรหัสผ่านที่ลงทะเบียนไว้
- เมื่อ logout แล้วจะไม่สามารถเข้าถึง `/admin` ได้จนกว่าจะ login ใหม่

---

## 📝 หมายเหตุ

- ระบบป้องกัน route guard: ทุกหน้า `/admin` จะ redirect ไป `/login` หากยังไม่ได้ login
- สามารถปรับแต่งเมนู, สี, และฟีเจอร์เพิ่มเติมได้ในไฟล์ `src/data/menu.ts` และโฟลเดอร์ `src/components/`

---

## 📂 โครงสร้างโฟลเดอร์หลัก

- `src/app/` — หน้าเว็บทั้งหมด (public, admin, login)
- `src/components/` — UI components และ reusable logic
- `src/data/menu.ts` — เมนู sidebar ของ admin
- `src/lib/supabaseClient.ts` — การเชื่อมต่อ Supabase

---

## 🧑‍💻 Contributors

- [Your Name](https://github.com/your-username) (Maintainer)
- ... (เพิ่มรายชื่อ contributors ที่นี่)

---

## License

MIT

---

หากมีข้อสงสัยหรือพบปัญหา สามารถเปิด issue หรือ pull request ได้เลย!
