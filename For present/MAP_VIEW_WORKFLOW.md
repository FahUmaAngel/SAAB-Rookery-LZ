# Workflow และอธิบายการทำงานของหน้า Map View (`map-view.html`)

เอกสารนี้อธิบายโครงสร้าง ลำดับการทำงาน (Workflow) และเจาะลึกการทำงานในแต่ละส่วนของหน้าจอ **Tactical Map View** ซึ่งเป็นหัวใจสำคัญในการแสดงภาพรวมสถานการณ์ (Situational Awareness) ของระบบ C2

---

## 1. โครงสร้างหลักของหน้าจอ (Layout & Structure)

หน้า `map-view.html` ถูกออกแบบมาให้เป็น Web Application แบบเต็มหน้าจอ (Full-screen) โดยแบ่งโครงสร้างหลักออกเป็น 3 ส่วน:

1.  **Navigation (ส่วนนำทาง):**
    *   โหลด Top Navbar และ Side Navbar ผ่าน JavaScript (`shared-components.js`) เพื่อให้ทำงานเป็น Single Page Application (SPA)
2.  **Main Canvas (ส่วนแผนที่ตรงกลาง):**
    *   พื้นที่แสดงแผนที่ Leaflet.js แบบ Interactive
    *   มี HUD Overlay วางทับอยู่ด้านบน เพื่อแสดงข้อความสถานะ (เช่น DATALINK SYNCED) และ Legend (คำอธิบายสัญลักษณ์ในแผนที่)
3.  **Right Telemetry Sidebar (แผงข้อมูลด้านขวา):**
    *   แสดงข้อมูลประกอบการตัดสินใจแบบเรียลไทม์ (จำลอง) ได้แก่:
        *   **System Status:** ระดับภัยคุกคามปัจจุบัน (THREAT LEVEL: ALPHA)
        *   **Asset Readiness:** สถานะความพร้อมของฝูงบินรบตามฐานต่างๆ (F7, F17, F21)
        *   **Sensor Health:** สถานะการทำงานของเรดาร์, ดาวเทียม ICEYE, และ ESM
        *   **Incident Log:** ประวัติเหตุการณ์ที่เพิ่งเกิดขึ้น (เช่น การสั่ง Scramble เครื่องบิน)

---

## 2. ลำดับการทำงาน (Workflow) เมื่อโหลดหน้าจอ

เมื่อผู้ใช้เปิดหน้า `map-view.html` ระบบจะมีลำดับการทำงานดังนี้:

### Step 1: โหลด CSS และตั้งค่า Animations
*   โหลด Tailwind CSS สำหรับการจัด Layout
*   โหลดแท็ก `<style>` ภายในไฟล์ ซึ่งบรรจุ **CSS Animations** ที่สำคัญเพื่อทำให้ UI ดูมีชีวิตชีวา (Dynamic) เช่น:
    *   `radarSweep`: เอฟเฟกต์แสงเรดาร์กวาดเป็นวงกลม
    *   `nodePulse` / `friendlyPulse`: เอฟเฟกต์ไฟกะพริบสำหรับเป้าหมายฝ่ายเราหรือสถานีเรดาร์
    *   `hostilePulse`: เอฟเฟกต์กะพริบสีแดงเตือนภัยสำหรับเป้าหมายศัตรู

### Step 2: โหลด Layout และ Sidebar
*   เบราว์เซอร์จะวาด DOM elements ของแผง Telemetry ด้านขวาทันทีด้วยข้อมูลแบบ Static (UI จำลองสถานการณ์)

### Step 3: Initialize Leaflet Map (ผ่าน IIFE `initMapView`)
*   ฟังก์ชัน `initMapView()` จะเริ่มทำงานทันที โดยทำหน้าที่:
    1.  **Dependency Check:** ตรวจสอบว่ามี Library ของ Leaflet.js หรือยัง ถ้ายังไม่มี จะทำการสร้าง `<link>` และ `<script>` เพื่อโหลดจาก CDN ทันทีแบบ Asynchronous
    2.  **Map Instantiation:** เมื่อโหลด Leaflet เสร็จ จะสร้างแผนที่ลงใน `<div id="map-view-container">` โดยตั้งจุดกึ่งกลางไว้ที่ทะเลบอลติก `[60.0, 19.0]`
    3.  **Tile Layer:** โหลดแผนที่ฐาน (Base Map) โทนสีมืดและไม่มีตัวหนังสือ (`dark_nolabels` จาก CartoDB) เพื่อให้เหมาะกับ Tactical UI

### Step 4: วาดข้อมูลยุทธวิธีลงบนแผนที่ (Tactical Overlays)
ระบบจะทำการวาด Layer ต่างๆ ซ้อนทับลงบนแผนที่ตามลำดับ (ล่างขึ้นบน) ดังนี้:

1.  **Radar Nodes & Sweep (สถานีเรดาร์):**
    *   วาดวงกลมรัศมีครอบคลุม (`L.circle`) สำหรับสถานีเรดาร์หลักๆ (Visby, Uppsala, ฯลฯ)
    *   วาง `L.divIcon` ที่เป็น CSS Animation `radarSweep` ไว้ตรงกลางเพื่อทำเอฟเฟกต์เรดาร์กวาด
2.  **Sovereign Boundary (เส้นขอบเขตอธิปไตย 12 ไมล์ทะเล):**
    *   ใช้ `L.polyline` ลากเส้นประสีแดงอ่อนๆ ตามแนวชายฝั่งสวีเดนและรอบเกาะ Gotland เพื่อกำหนดเขตหวงห้าม
3.  **ICEYE Satellite Swath (พื้นที่สแกนของดาวเทียม):**
    *   ใช้ `L.polygon` วาดพื้นที่สี่เหลี่ยมโปร่งแสงเฉียงๆ เพื่อจำลองพื้นที่ที่ดาวเทียม SAR กำลังสแกนหาข้อมูล
4.  **Air Bases (ฐานทัพอากาศ):**
    *   วาง Marker สำหรับฐาน F7, F17, และ F21
    *   ฐาน F17 จะมีสถานะ `highlight: true` ทำให้เกิดแสงสีแดงกะพริบ เพื่อแสดงว่ากำลังมีเครื่องบินถูกสั่ง Scramble จากฐานนี้
5.  **Hostile Track - TRK-U99 (เป้าหมายศัตรู):**
    *   สร้าง Marker รูปข้าวหลามตัดสีแดงกะพริบ (`hostile-diamond`) วางไว้กลางทะเล
    *   ผูก Popup เพื่อแสดงข้อมูลเมื่อคลิก (เช่น ความเร็ว, ระดับความสูง, สถานะ Transponder)
6.  **AI Probability Cone (พื้นที่คาดการณ์ด้วย AI):**
    *   วาด `L.polygon` รูปกรวยบานออกด้านหน้าของ TRK-U99 เพื่อแสดงทิศทางที่ AI คาดการณ์ว่าเป้าหมายจะบินไปในช่วง 10 นาทีข้างหน้า
7.  **Friendly Track - BLU-01 (เครื่องบินสกัดกั้นฝ่ายเรา):**
    *   สร้าง Marker สีฟ้ากะพริบ เพื่อเป็นตัวแทนของ JAS 39 Gripen ที่บินขึ้นจาก F17
    *   ลากเส้นประ `L.polyline` แสดงเส้นทางการบิน (Trajectory) พุ่งตรงเข้าสกัดกั้นเป้าหมาย TRK-U99

---

## 3. สรุปความสำคัญทางเทคนิค

*   **Custom HTML Markers (`L.divIcon`):** หน้าจอนี้ไม่ได้ใช้ Marker รูปหมุดธรรมดาของ Leaflet แต่ใช้การฝัง HTML และ CSS แท้ๆ ลงไปในแผนที่ ทำให้สามารถใส่ Animation (กะพริบ, หมุน) และจัดแต่งให้เป็นแบบ Tactical HUD ได้ 100%
*   **SPA Compatibility:** ฟังก์ชันการโหลดแผนที่มีการทำ Cleanup (`window.mapViewInstance.remove()`) เอาไว้ เพื่อรองรับการสลับหน้าไปมาโดยที่ Memory ไม่รั่ว (Memory Leak)
*   **Decoupled UI:** โครงสร้างถูกแบ่งชัดเจนระหว่าง "แผนที่ (Map Canvas)" และ "แผงข้อมูล (Telemetry Sidebar)" ทำให้ในอนาคตสามารถนำข้อมูลจาก Backend API มาผูกเข้ากับ Sidebar ได้ง่ายโดยไม่กระทบแผนที่
