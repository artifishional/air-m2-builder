import { exec } from "child_process"

const task = [];

export default ( { npm }, cb ) => {

    if(!task.length) {

        setTimeout( () => {

            const installing = task.map(([npm])=> npm).join(" ");
            const after = task.map(([,cb])=> cb);

            exec(`npm install --no-save ${installing}`,
                (err) => after.map(cb=> cb(err))
            );

            task.length = 0;

        }, 300 );

    }

    task.push( [ npm, cb ] );

}