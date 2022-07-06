import { programs } from "@metaplex/js";
import * as anchor from "@project-serum/anchor";
import type { NextPage } from "next";
import { useCallback, useState } from "react";

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

const {
  metadata: { Metadata, MasterEdition, Edition },
} = programs;

const connection = new anchor.web3.Connection(
  "https://solana-api.projectserum.com"
);

const Home: NextPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [metadataList, setMetadataList] = useState<
    programs.metadata.Metadata[]
  >([]);
  const [editionPubKeyList, setEditionPubKeyList] = useState<{
    [key: string]: string[];
  }>({});
  const [limitedEditionMintList, setLimitedEditionMintList] = useState<
    string[]
  >([]);

  const getMintList = useCallback(
    async (masterEditionMint: anchor.web3.PublicKey) => {
      setIsLoading(true);
      setLimitedEditionMintList([]);
      let metadatas = metadataList;
      if (metadataList.length < 1) {
        metadatas = await Metadata.findMany(connection, {
          updateAuthority: new anchor.web3.PublicKey(
            "trshC9cTgL3BPXoAbp5w9UfnUMWEJx5G61vUijXPMLH" // 'trsh' wallet address
          ),
        });
        setMetadataList(metadatas);
      }

      let editionPubKeys = editionPubKeyList[masterEditionMint.toBase58()];
      if (!editionPubKeys || editionPubKeys.length < 1) {
        const [masterEditionPDA] =
          await anchor.web3.PublicKey.findProgramAddress(
            [
              Buffer.from("metadata"),
              TOKEN_METADATA_PROGRAM_ID.toBuffer(),
              masterEditionMint.toBuffer(),
              Buffer.from("edition"),
            ],
            TOKEN_METADATA_PROGRAM_ID
          );
        const masterEdition = await MasterEdition.load(
          connection,
          masterEditionPDA
        );
        editionPubKeys = (await masterEdition.getEditions(connection)).map(
          (e) => e.pubkey.toBase58()
        );
        setEditionPubKeyList((state) => {
          state[masterEditionMint.toBase58()] = editionPubKeys;
          return state;
        });
      }

      const limitedEditionMints: string[] = [];
      await Promise.all(
        metadatas.map(async (metadata) => {
          const editionPDA = await Edition.getPDA(
            new anchor.web3.PublicKey(metadata.data.mint)
          );
          if (editionPubKeys.includes(editionPDA.toBase58())) {
            limitedEditionMints.push(metadata.data.mint);
          }
        })
      );
      setLimitedEditionMintList(limitedEditionMints);
      setIsLoading(false);
    },
    [editionPubKeyList, metadataList]
  );

  return (
    <div className="p-4">
      <div className="my-2">
        Crayon Cake{" "}
        <a
          className="underline"
          href="https://explorer.solana.com/address/4QSNp8eMPQnXNV3BTHqn5QAAG48sND7Ap3ea8yGnGY1E"
          target="_blank"
          rel="noreferrer"
        >
          4QSNp8eMPQnXNV3BTHqn5QAAG48sND7Ap3ea8yGnGY1E
        </a>
        <button
          className="bg-sky-500 px-4 text-white rounded-md text-sm h-6 mx-4 hover:bg-sky-500/75 disabled:bg-gray-500"
          disabled={isLoading}
          onClick={() =>
            getMintList(
              new anchor.web3.PublicKey(
                "4QSNp8eMPQnXNV3BTHqn5QAAG48sND7Ap3ea8yGnGY1E"
              )
            )
          }
        >
          Limited Edition Mint List
        </button>
      </div>
      <div className="my-2">
        The Garbage Special{" "}
        <a
          className="underline"
          href="https://explorer.solana.com/address/F1RctUkkV5SW1viemL6ZpqBoKSdGVTLQxcUdVSxiGKMj"
          target="_blank"
          rel="noreferrer"
        >
          F1RctUkkV5SW1viemL6ZpqBoKSdGVTLQxcUdVSxiGKMj
        </a>
        <button
          className="bg-sky-500 px-4 text-white rounded-md text-sm h-6 mx-4 hover:bg-sky-500/75 disabled:bg-gray-500"
          disabled={isLoading}
          onClick={() =>
            getMintList(
              new anchor.web3.PublicKey(
                "F1RctUkkV5SW1viemL6ZpqBoKSdGVTLQxcUdVSxiGKMj"
              )
            )
          }
        >
          Limited Edition Mint List
        </button>
      </div>
      {isLoading && <div className="my-2">Loading ...</div>}
      {limitedEditionMintList.map((mint) => (
        <div key={mint}>
          <a
            href={`https://explorer.solana.com/accounts/${mint}`}
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            {mint}
          </a>
        </div>
      ))}
    </div>
  );
};

export default Home;
