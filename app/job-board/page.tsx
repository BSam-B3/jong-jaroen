// --- แก้ไขเฉพาะฟังก์ชัน fetchFreelanceJobs (ประมาณบรรทัดที่ 50) ---
const fetchFreelanceJobs = useCallback(async (uid?: string) => {
  setIsLoading(true);
  
  // 🌟 ปรับ Syntax .not ให้เป็น Array และเพิ่มการเช็ค error
  let query = supabase.from('jobs')
    .select(`*, employer:profiles!employer_id (first_name, full_name, avatar_url)`)
    .eq('status', 'open')
    .not('job_type', 'in', ['ride', 'buy', 'deliver']) // แก้เป็น Array
    .order('created_at', { ascending: false })
    .limit(displayLimit);

  if (activeCategory !== 'all') {
    query = query.eq('category', activeCategory);
  }
  
  if (uid) {
    query = query.neq('employer_id', uid);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error.message);
  } else {
    setJobs(data || []);
  }
  
  setIsLoading(false);
}, [supabase, activeCategory, displayLimit]);
