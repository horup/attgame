let nextId = 1;

export default function newId():string
{
    let id = nextId++;
    return nextId.toString();
}