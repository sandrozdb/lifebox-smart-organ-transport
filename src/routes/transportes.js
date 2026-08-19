const express=require('express');const repository=require('../repositories');const service=require('../services/transportService');
const router=express.Router();
router.get('/',async(_req,res,next)=>{try{res.json(await repository.listTransportes())}catch(e){next(e)}});
router.post('/',async(req,res,next)=>{try{const required=['codigo_transporte','identificador_caixa','tipo_orgao','hospital_origem','hospital_destino','latitude_origem','longitude_origem','latitude_destino','longitude_destino'];const missing=required.filter(x=>req.body[x]===undefined||req.body[x]==='');if(missing.length)return res.status(400).json({erro:`Campos obrigatórios: ${missing.join(', ')}`});res.status(201).json(await repository.createTransporte(req.body))}catch(e){next(e)}});
router.get('/:id',async(req,res,next)=>{try{const row=await repository.getTransporte(req.params.id);row?res.json(row):res.status(404).json({erro:'Transporte não encontrado.'})}catch(e){next(e)}});
router.post('/:id/iniciar',async(req,res,next)=>{try{res.json(await service.start(req.params.id))}catch(e){next(e)}});
router.post('/:id/finalizar',async(req,res,next)=>{try{res.json(await service.finish(req.params.id))}catch(e){next(e)}});
router.get('/:id/leituras',async(req,res,next)=>{try{res.json(await repository.getLeituras(req.params.id,Math.min(Number(req.query.limite)||100,1000)))}catch(e){next(e)}});
router.get('/:id/alertas',async(req,res,next)=>{try{res.json(await repository.getAlertas(req.params.id))}catch(e){next(e)}});
router.get('/:id/eventos',async(req,res,next)=>{try{res.json(await repository.getEventos(req.params.id))}catch(e){next(e)}});
router.get('/:id/rastreabilidade',async(req,res,next)=>{try{res.json(await service.tracking(req.params.id))}catch(e){next(e)}});
router.get('/:id/resumo',async(req,res,next)=>{try{res.json(await service.summary(req.params.id))}catch(e){next(e)}});
module.exports=router;

