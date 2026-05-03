const handleUploadSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipFile) return alert('กรุณาแนบรูปสลิปโอนเงินด้วยจ้า');
    
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('กรุณาเข้าสู่ระบบก่อนทำรายการค่ะ');

      // 1️⃣ สร้างชื่อไฟล์และ Path ตามที่ C ออกแบบไว้ (slips-pending/{employer_id}/{job_id}/{uuid}.jpg)
      const fileExt = slipFile.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${session.user.id}/${jobId}/${fileName}`;

      // 2️⃣ อัปโหลดรูปสลิปขึ้น Private Bucket
      const { error: uploadError } = await supabase.storage
        .from('slips-pending')
        .upload(filePath, slipFile);

      if (uploadError) throw new Error('อัปโหลดรูปไม่สำเร็จ: ' + uploadError.message);

      // 3️⃣ เรียกใช้ RPC ของ C เพื่อล็อกสถานะงาน
      const { error: rpcError } = await supabase.rpc('submit_slip', {
        p_job_id: jobId,
        p_slip_path: filePath,
        p_trans_ref: `MOCK_REF_${Date.now()}`, // 💡 ชั่วคราว: จำลองเลข Ref ไปก่อนจนกว่าเราจะต่อ EasySlip API
        p_amount_satang: totalAmount * 100 // แปลงสกุลเงินเป็นสตางค์ตามที่ C บรีฟไว้
      });

      if (rpcError) throw new Error('บันทึกข้อมูลไม่สำเร็จ: ' + rpcError.message);

      // สำเร็จ! เปลี่ยนหน้าจอเป็น Success State
      setIsSuccess(true);
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
