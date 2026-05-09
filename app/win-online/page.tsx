// 🌟 1. ปรับฟังก์ชันดึงข้อมูลให้มีโหมด isSilent (ไม่โชว์อนิเมชันโหลดทับถ้าดึงแบบ Realtime)
  const fetchMyActiveJobs = useCallback(async (userId: string, isSilent = false) => {
    if (!isSilent) setIsLoading(true); // โชว์โหลดแค่ตอนเข้าหน้าครั้งแรก
    
    // ดึงเฉพาะงานที่เราเป็นคนจ้าง และสถานะกำลังรอ/กำลังทำ
    const { data } = await supabase.from('jobs')
      .select(`*, worker:profiles!worker_id (full_name)`)
      .eq('employer_id', userId)
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false });
    
    if (data) setJobs(data);
    if (!isSilent) setIsLoading(false);
  }, [supabase]);

  // 🌟 2. ดึงข้อมูล User เริ่มต้น (ทำงานแค่ครั้งเดียว ป้องกัน Infinite Loop)
  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        fetchMyActiveJobs(session.user.id);
      } else {
        setIsLoading(false);
      }
    };
    initData();
  }, [fetchMyActiveJobs, supabase]);

  // 🌟 3. จัดการ Real-time (ทำงานเมื่อรู้แล้วว่า User คือใคร)
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel('public-jobs-win-customer')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'jobs', 
        filter: `employer_id=eq.${currentUser.id}` 
      }, () => {
        // เมื่อมีการเปลี่ยนแปลง ให้อัปเดตข้อมูลแบบเงียบๆ (isSilent = true)
        fetchMyActiveJobs(currentUser.id, true); 
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMyActiveJobs, supabase, currentUser]);
