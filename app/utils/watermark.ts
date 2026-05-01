// app/utils/watermark.ts

export async function addKycWatermark(file: File, userId: string): Promise<File> {
  return new Promise((resolve, reject) => {
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
          reject(new Error('Cannot get canvas context'));
          return;
        }

        // 3. วาดรูปต้นฉบับลงบน Canvas
        ctx.drawImage(img, 0, 0);

        // 4. ตั้งค่าตัวหนังสือลายน้ำ
        const text = `ใช้สำหรับยืนยันตัวตนแอป "จงเจริญ" เท่านั้น  ID: ${userId.slice(0, 8)}`;
        const dateText = `วันที่ ${new Date().toLocaleDateString('th-TH')}`;
        
        // คำนวณขนาดฟอนต์ตามความกว้างรูป
        const fontSize = Math.max(16, Math.floor(img.width / 30));
        ctx.font = `bold ${fontSize}px "Prompt", "Helvetica", sans-serif`;
        ctx.fillStyle = 'rgba(238, 77, 45, 0.25)'; // สีส้มจงเจริญ โปร่งแสง 25%
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

        // วาดให้เต็มทั่วรูป (✅ แก้ไขเอา </tr> ออกแล้ว ใส่ปีกกาปิดปกติค่ะ)
        for (let x = -img.width; x < img.width * 2; x += spacingX) {
          for (let y = -img.height; y < img.height * 2; y += spacingY) {
            ctx.fillText(text, x, y);
            ctx.fillText(dateText, x, y + fontSize * 1.2);
          }
        }

        // คืนสถานะ Canvas
        ctx.restore();

        // 6. แปลง Canvas กลับเป็นไฟล์ Blob แล้วแปลงเป็น File
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas to Blob failed'));
            return;
          }
          // สร้างไฟล์ใหม่ ชื่อเดิม แต่เป็นรูปที่ประทับลายน้ำแล้ว
          const watermarkedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(watermarkedFile);
        }, file.type);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}
