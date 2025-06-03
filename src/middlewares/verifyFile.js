const verifyFile = (req,res,next) => {

    if(!req.files || Object.keys(req.files).length === 0)
        return res.status(400).json({msg:'Ningun archivo fue cargado'});

    next();
};

module.exports = {
    verifyFile
};