const { response } = require('express');
const Role = require("../models/role");
const Users = require('../models/users');
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;


const createRole = async (req, res = response) => {

    try {

        const role = new Role(req.body);

        await role.save();

        res.status(201).json({
            ok: true,
            msg: 'El rol fue creado correctamente',
        })

    } catch (error) {
        console.error(error.message);
    }
}


const getRoles = async (req, res = response) => {
    const { id } = req.params;

    try {

        const rolesFound = await Role.find();

        if (rolesFound === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'No fueron encontrados roles registrados'
            })
        } else {
            return res.status(200).json(rolesFound)
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Un error fue detectado, por favor habla con el administrador'
        })
    }
}

const getRolByUser = async (req, res = response) => {
    const { rol } = req.params;

    try {
        const userRole = rol;

        let rolesToReturn;

        switch (userRole) {
            case 'Super Administrador':
                rolesToReturn = await Role.find();
                break;
            case 'Administrador':
                rolesToReturn = await Role.find();
                break;
            case 'Empleado':
                rolesToReturn = await Role.find({
                    name: { $in: ['Socio'] }
                });
                break;
            case 'Socio':
                rolesToReturn = await Role.find({
                    name: { $in: ['Socio'] }
                });
                break;
            default:
                return res.status(403).json({
                    ok: false,
                    msg: 'No tienes permisos para ver los roles'
                });
        }

        if (!rolesToReturn || rolesToReturn.length === 0) {
            return res.status(404).json({
                ok: false,
                msg: 'No se encontraron roles disponibles para tu nivel de acceso'
            });
        }

        return res.status(200).json(rolesToReturn);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Un error fue detectado, por favor habla con el administrador'
        });
    }
};



const updatedRol = async (req, res = response) => {


    const { id_rol } = req.params;
    const { data } = req.body;



    try {

        const updateRol = await Role.findByIdAndUpdate(
            id_rol,
            data,
            {
                new: true,
            }
        );


        if (!updateRol) {
            return res.status(404).json({
                ok: false,
                msg: 'Rol no encontrado'
            })
        }
        else {

            return res.status(200).json({ ok: true, msg: 'Rol actualizado correctamente' });
        }



    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Un error fue detectado, por favor habla con el administrador'
        })
    }
}





const deactivateRol = async (req, res = response) => {

    const { id_rol } = req.params;

    try {

        const updateRole = await Role.findByIdAndUpdate(
            id_rol,
            req.body,
            {
                new: true,
            }
        );


        if (!updateRole) {
            return res.status(404).json({
                ok: false,
                msg: 'Rol no encontrado'
            })
        }
        else {

            return res.status(200).json({
                ok: true,
                msg: 'Rol eliminado correctamente'
            });
        }



    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Un error fue detectado, por favor habla con el administrador'
        })
    }


}





module.exports = {
    createRole,
    getRoles,
    getRolByUser,
    updatedRol,
    deactivateRol
}