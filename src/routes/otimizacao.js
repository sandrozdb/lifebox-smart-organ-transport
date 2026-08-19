const express=require('express');const service=require('../services/routeOptimizationService');const router=express.Router();
router.get('/candidatas/:transporteId',async(req,res,next)=>{try{res.json(service.getCandidates(req.params.transporteId))}catch(e){next(e)}});
router.get('/:transporteId',async(req,res,next)=>{try{res.json(await service.getLatest(req.params.transporteId)||{...service.getCandidates(req.params.transporteId),selectedRouteId:null})}catch(e){next(e)}});
router.post('/:transporteId/calcular',async(req,res,next)=>{try{res.json(await service.optimize(req.params.transporteId,req.body||{}))}catch(e){next(e)}});
module.exports=router;