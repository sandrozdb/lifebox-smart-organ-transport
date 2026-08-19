const express=require('express');const service=require('../services/physicsService');const router=express.Router();
router.get('/:transporteId',async(req,res,next)=>{try{res.json(await service.analyze(req.params.transporteId))}catch(e){next(e)}});module.exports=router;

