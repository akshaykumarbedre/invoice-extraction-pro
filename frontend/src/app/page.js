'use client'


import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation';
const page = () => {
  const router=useRouter();
  useEffect(()=>{

    router.push('/imagedest');
  },[])
  return (
    <div>Loading</div>
  )
}

export default page