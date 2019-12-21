export const APP_NAME = 'Dice Roller'

export const FACES = [ 4, 6, 8, 10, 12, 20 ]

export const FAVORITES = [
  [ 'Bunco', '3d6' ],
  [ 'Dungeons & Dragons', '1d4 1d6 1d8 1d10 1d12 1d20' ],
  [ 'Midnight', '6d6' ],
  [ 'Yahtzee', '5d6' ]
].map(([ label, formula ]) => ({ label, formula }))
