useEffect(() => {
    async function fetchData() {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
      setProfile(profileData);

      if (profileData) {
        // 1. ดึงรายชื่อไฟล์ทั้งหมดออกมา
        const { data: files, error: listError } = await supabase.storage
          .from('kyc_documents')
          .list(userId);

        console.log("รายการไฟล์ที่เจอ:", files); // แอบปริ้นท์ดูใน Console เผื่อมีปัญหา

        if (files && files.length > 0) {
          // 2. 🔍 กรองหา "ไฟล์รูปภาพจริงๆ" (ข้ามไฟล์ผีของระบบ)
          const realImageFile = files.find(f => 
            f.name.toLowerCase().endsWith('.jpg') || 
            f.name.toLowerCase().endsWith('.jpeg') || 
            f.name.toLowerCase().endsWith('.png')
          );

          if (realImageFile) {
            // 3. เอาไฟล์รูปของจริงมาสร้างลิงก์
            const { data: fileLink, error: urlError } = await supabase.storage
              .from('kyc_documents') 
              .createSignedUrl(`${userId}/${realImageFile.name}`, 3600);
            
            console.log("ลิงก์รูปภาพ:", fileLink, "Error:", urlError);
            if (fileLink) setImageUrl(fileLink.signedUrl);
          }
        }
      }
      
      setLoading(false);
    }
    if (userId) fetchData();
  }, [userId]);
