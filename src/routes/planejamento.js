const express=require('express');const service=require('../services/organPlanningService');const {FallbackLocationProvider}=require('../services/locationProvider');const router=express.Router();
router.get('/perfis',(_req,res)=>res.json(service.getProfiles()));
router.get('/cenarios',(_req,res)=>res.json(service.getDemoScenarios()));
router.get('/perfis/:code',(req,res)=>{const profile=service.getProfiles().find(item=>item.code===req.params.code.toUpperCase());if(!profile)return res.status(404).json({erro:'Perfil não encontrado.'});res.json(profile)});
router.post('/geocodificar',async(req,res,next)=>{try{const point=await new FallbackLocationProvider().geocode(req.body?.query,req.body?.role);res.json(point)}catch(error){next(error)}});
router.post('/calcular',async(req,res,next)=>{try{res.json(await service.calculate(req.body||{}))}catch(error){next(error)}});
module.exports=router;