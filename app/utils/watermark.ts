// app/utils/watermark.ts

export async function addKycWatermark(file: File, userId: string): Promise<File> {
  return new Promise((resolve, reject) => {
    // 🛡️ ป้องกันกรณี Next.js เผลอเรียกใช้ฝั่ง Server (Canvas มีเฉพาะฝั่ง Client)
    if (typeof window === 'undefined') {
      return reject(new Error('ฟังก์ชันนี้ต้องทำงานบนเบราว์เซอร์เท่านั้นค่ะ'));
    }

    // 1. อ่านไฟล์รูปภาพ
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // 2. สร้าง Canvas ตามขนาดรูปต้นฉบับ
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('ไม่สามารถสร้าง Canvas Context ได้ค่ะ'));
          return;
        }

        // 3. วาดรูปต้นฉบับลงบน Canvas
        ctx.drawImage(img, 0, 0);

        // 4. ตั้งค่าตัวหนังสือลายน้ำ
        const text = `ใช้สำหรับยืนยันตัวตนแอป "จงเจริญ" เท่านั้น  ID: ${userId.slice(0, 8)}`;
        const dateText = `วันที่ ${new Date().toLocaleDateString('th-TH')}`;
        
        // คำนวณขนาดฟอนต์ตามความกว้างรูป (ให้ตัวหนังสือใหญ่พอดีกับภาพ)
        const fontSize = Math.max(16, Math.floor(img.width / 30));
        ctx.font = `bold ${fontSize}px "Prompt", "Helvetica", sans-serif`;
        ctx.fillStyle = 'rgba(238, 77, 45, 0.4)'; // สีส้มจงเจริญ โปร่งแสง 40% ให้เห็นชัดขึ้นนิดนึง
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 5. หมุน Canvas และวาดลายน้ำแบบวนซ้ำ (Tiled pattern)
        const angle = -35; // มุมเอียง
        const spacingX = fontSize * 18; // ระยะห่างแนวนอน
        const spacingY = fontSize * 5; // ระยะห่างแนวตั้ง

        // บันทึกสถานะก่อนหมุน
        ctx.save();
        
        // หมุนตัวหนังสือ
        ctx.rotate((angle * Math.PI) / 180);

        // วาดให้เต็มทั่วรูป
        for (let x = -img.width; x < img.width * 2; x += spacingX) {
          for (let y = -img.height; y < img.height * 2; y += spacingY) {
            ctx.fillText(text, x, y);
            ctx.fillText(dateText, x, y + fontSize * 1.2);
          }
        }

        // คืนสถานะ Canvas
        ctx.restore();

        // 6. แปลง Canvas กลับเป็นไฟล์ Blob (🌟 อัปเกรด: บังคับแปลงเป็น JPEG และบีบอัดคุณภาพเหลือ 80%)
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('การแปลงภาพล้มเหลวค่ะ'));
            return;
          }
          
          // เปลี่ยนนามสกุลไฟล์ให้เป็น .jpg เพื่อให้ตรงกับประเภทของ Blob
          const originalName = file.name.replace(/\.[^/.]+$/, ""); // ตัดนามสกุลเดิมออก
          const newFileName = `${originalName}_watermarked.jpg`;

          // สร้างไฟล์ใหม่พร้อมส่งกลับไปให้ระบบอัปโหลด
          const watermarkedFile = new File([blob], newFileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          
          resolve(watermarkedFile);
        }, 'image/jpeg', 0.8); // 0.8 คือคุณภาพ 80% ช่วยลดขนาดไฟล์ได้เยอะมากค่ะ
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}
