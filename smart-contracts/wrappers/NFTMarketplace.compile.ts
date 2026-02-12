import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
  lang: 'func',
  targets: [
    'contracts/stdlib.fc',
    'contracts/op_codes.fc',
    'contracts/errors.fc',
    'contracts/utils.fc',
    'contracts/highload_adapter.fc',
    'contracts/nft_marketplace.fc',
  ],
};
