
## การเริ่มต้นใช้งาน

1. **ติดตั้ง dependencies**
   ```bash
   npm install
   ```

2. **ตั้งค่าตัวแปรแวดล้อม (Environment Variables)**
   - สร้างไฟล์ `.env.local` ที่ root ของโปรเจกต์
   - เพิ่มค่าเช่น
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```

3. **เริ่มเซิร์ฟเวอร์สำหรับพัฒนา**
   ```bash
   npm run dev
   ```

4. **เปิดเว็บในเบราว์เซอร์**
   - ไปที่ [http://localhost:3000](http://localhost:3000)

## การ deploy

สามารถ deploy ขึ้น Vercel, Netlify หรือแพลตฟอร์มที่รองรับ Next.js ได้ทันที

## คำสั่งที่ใช้บ่อย

- `npm run dev` — รันเซิร์ฟเวอร์สำหรับพัฒนา
- `npm run build` — สร้าง production build
- `npm start` — รัน production build

## License

MIT

---

> หากต้องการข้อมูลเพิ่มเติมหรือคู่มือการใช้งาน สามารถติดต่อผู้พัฒนาได้โดยตรง