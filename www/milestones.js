export function getMilestone(bond){

    const milestones = [
        10,
        20,
        50,
        100,
        200,
        500,
        1000
    ];

    return milestones.includes(
        bond
    );
}
