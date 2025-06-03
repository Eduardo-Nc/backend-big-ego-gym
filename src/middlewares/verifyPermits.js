const Role = require("../models/role");

const verifyPermits = async (req, res, next) => {


    const { rolPermiso } = req.body;



    const rolesFound = await Role.findById(rolPermiso);


    // console.log(rolesFound)


    if (!rolPermiso) {
        return res.status(404).json({
            ok: false,
            msg: 'Necesitas enviar tu rol'
        })
    } else if (rolesFound === 0) {
        return res.status(404).json({
            ok: false,
            msg: 'No fue encontrado el rol de tu usuario'
        })
    }



    // next();
};

module.exports = {
    verifyPermits
};