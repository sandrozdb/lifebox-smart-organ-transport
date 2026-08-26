const express=require('express');const service=require('../services/simulationService');const router=express.Router();
router.get('/status',(_req,res)=>res.json(service.status()));
router.post('/start',async(req,res,next)=>{try{res.json(await service.start(req.body.transporteId||1,req.body.rotaId,req.body.plan,req.body.result))}catch(e){next(e)}});
router.post('/stop',async(_req,res,next)=>{try{res.json(await service.stop())}catch(e){next(e)}});
router.post('/reset',async(req,res,next)=>{try{res.json(await service.reset(req.body.transporteId||1))}catch(e){next(e)}});router.post('/reotimizar/aplicar',async(req,res,next)=>{try{res.json(await service.applyReoptimization(req.body.transporteId||1,req.body.plan,req.body.result,req.body.reason))}catch(e){next(e)}});
router.post('/cenario',async(req,res,next)=>{try{res.json(await service.scenario(req.body.cenario,req.body.transporteId))}catch(e){next(e)}});
module.exports=router;

