import { useGlobalState, useEffect } from "tram-one"
import Pokedex from 'pokedex-promise-v2'
const PokeAPI = new Pokedex()

const usePokemonName = () => {
  const [pokemonName, setPokemonName] = useGlobalState('pokemon-name', '')
  const onUpdatePokemonName = (event) => setPokemonName(event.target.value)

  return {
    pokemonName, onUpdatePokemonName
  }
}

// get all the pokemon variations
const usePokemonVariants = () => {
  const [pokemonVariants, setPokemonVariants] = useGlobalState('pokemon-variants', {})
  const { pokemonName } = usePokemonName()
  useEffect(async () => {
    if (pokemonVariants[pokemonName]) {
      return null;
    }
    setPokemonVariants({...pokemonVariants, [pokemonName]: "LOADING"})
    const pokemonSpeciesObject = await PokeAPI.getPokemonSpeciesByName(pokemonName.toLowerCase())
    if (!pokemonSpeciesObject) {
      return null;
    }
    setPokemonVariants({...pokemonVariants, [pokemonName]: pokemonSpeciesObject.varieties})
  }, [pokemonName])
  return { pokemonVariants }
}

// get specific pokemon variations
const usePokemonVariation = () => {
  const [pokemonVariation, setPokemonVariation] = useGlobalState('pokemon-variation', null)
  const { pokemonName } = usePokemonName()
  const onUpdatePokemonVariation = (event) => {
    const varient = event.target.value;
    setPokemonVariation(varient)
  }

  useEffect(() => {
    if (pokemonVariation) {
      setPokemonVariation(null)
    }
  }, [pokemonName])

  return { pokemonVariation, onUpdatePokemonVariation }
}

const usePokemonMap = () => {
  const [pokemonMap, setPokemonMap] = useGlobalState('pokemon-map', {})
  const { pokemonName } = usePokemonName()
  const { pokemonVariants } = usePokemonVariants()
  const { pokemonVariation } = usePokemonVariation()

  useEffect(async () => {
    if (pokemonMap[pokemonName]) {
      return pokemonMap[pokemonName]
    }
    setPokemonMap({ ...pokemonMap, [pokemonName]: "LOADING"})
    const pokemonSpeciesObject = await PokeAPI.getPokemonSpeciesByName(pokemonName.toLowerCase())
    const pokemonDefaultVariation = pokemonSpeciesObject.varieties.find(({is_default}) => is_default)
    const pokemonObject = await PokeAPI.getPokemonByName(pokemonDefaultVariation.pokemon.name)
    setPokemonMap({ ...pokemonMap, [pokemonName]: pokemonObject})
  }, [pokemonName])

  useEffect(async () => {
    if (!pokemonVariation) { 
      return null
    }
    const pokemonVariationObject = pokemonVariants[pokemonName].find(({pokemon: {name}}) => name === pokemonVariation)
    const pokemonObject = await PokeAPI.getPokemonByName(pokemonVariationObject.pokemon.name)
    setPokemonMap({ ...pokemonMap, [pokemonName]: pokemonObject})  
  }, [pokemonName, pokemonVariation])

  return { pokemonMap }
}

const usePokemonMove = () => {
  const [pokemonMoveset, setPokemonMove] = useGlobalState('pokemon-moveset', [])
  const [pokemonMoves, setMoveDetails] = useGlobalState('pokemon-moves', {})
  const onUpdatePokemonMove = (index) => async (event) => {
    const moveName = event.target.value;
    setPokemonMove({
      ...pokemonMoveset, [index]: moveName
    })

    if (!pokemonMoves[moveName]) {
      const fetchedMove = await PokeAPI.getMoveByName(moveName)
      setMoveDetails({[moveName]: fetchedMove, ...pokemonMoves})
    }
  }

  return { pokemonMoveset, onUpdatePokemonMove, pokemonMoves }
}

export default () => {
  const { pokemonName, onUpdatePokemonName } = usePokemonName()
  const { pokemonMoveset, onUpdatePokemonMove, pokemonMoves } = usePokemonMove()
  const { pokemonMap } = usePokemonMap()
  const { pokemonVariation, onUpdatePokemonVariation } = usePokemonVariation()
  const { pokemonVariants } = usePokemonVariants()

  const pokemon = pokemonMap[pokemonName] === "LOADING" ? null : pokemonMap[pokemonName]

  return { pokemon, pokemonName, onUpdatePokemonName, pokemonMoveset, onUpdatePokemonMove, pokemonMoves, pokemonVariation, onUpdatePokemonVariation, pokemonVariants }
}
