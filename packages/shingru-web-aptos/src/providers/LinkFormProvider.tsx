"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/providers/AuthProvider";
import { useUser } from "@/providers/UserProvider";
import { EMOJI_PICKS, COLOR_PICKS } from "@/config/styling";
import { CHAINS, isTestnet, AVAILABLE_CHAINS } from "@/config/chains";
import { uploadFiles } from "@/lib/supabase/storage";
import {
  formatStringToNumericDecimals,
  serializeFormattedStringToFloat,
} from "@/utils/formatting";
import { PaymentTemplate } from "@/config/templates";
import { getFileUrl } from "@/utils/file";
import { linksService } from "@/lib/api/links";
import { usePhoton } from "@/hooks/usePhoton";

const isUsdcToken = (mintAddress: string, symbol?: string, name?: string) => {
  // First check by mint address
  const usdcAddresses = [
    CHAINS.APTOS_MAINNET.tokens.find((t) => t.symbol === "USDC")?.address,
    CHAINS.APTOS_TESTNET.tokens.find((t) => t.symbol === "USDC")?.address,
  ].filter(Boolean);

  if (usdcAddresses.includes(mintAddress as any)) {
    return true;
  }

  // Fallback: check by symbol and name patterns
  if (
    symbol === "USDC" ||
    (name &&
      (name.toLowerCase().includes("usdc") ||
        name.toLowerCase().includes("usd coin")))
  ) {
    return true;
  }

  return false;
};

export interface ChainTokenConfig {
  token: any | null;
  amount: string;
}

export interface DeliverableFile {
  id: string;
  file?: File; // Optional for existing files
  name: string;
  size: number;
  isExisting?: boolean; // Flag to identify existing files from server
  url?: string; // URL for existing files
}

export interface FormData {
  name: string;
  description: string;
  thumbnail: File | { url: string; name: string; size: number } | null;
  useThumbnail: boolean;
  pricingType: "fixed" | "open" | "free";
  supportedChains: string[];
  collectInfo: boolean;
  collectFields: {
    email: boolean;
    name: boolean;
    telegram: boolean;
  };
  // Pricing fields
  useCustomTokens: boolean;
  stablecoinAmount: string;
  stablecoinToken: any | null;
  chainTokenConfigs: Record<string, ChainTokenConfig>;
  // Simplified stablecoin tracking
  isStable: boolean;
  stableToken: string | null;
  // Digital product specific
  deliverableFiles: DeliverableFile[];
  deliveryUrl: string;
  thankYouMessage: string;
  // Fundraising specific
  goalAmount: string;
}

export interface LinkFormContextType {
  // Template selection
  selectedTemplate: PaymentTemplate | null;
  setSelectedTemplate: (template: PaymentTemplate | null) => void;

  // Form data
  formData: FormData;
  handleInputChange: (field: keyof FormData, value: any) => void;
  handleCollectFieldChange: (
    field: keyof FormData["collectFields"],
    checked: boolean
  ) => void;
  handleChainToggle: (chainId: string) => void;

  // Pricing handlers
  handleStablecoinInputChange: (output: any) => void;
  handleChainTokenInputChange: (chainId: string, output: any) => void;
  handlePricingTypeChange: (type: "fixed" | "open" | "free") => void;
  handleUseCustomTokensChange: (value: boolean) => void;

  // Digital product handlers
  handleDeliverableFilesChange: (files: DeliverableFile[]) => void;
  handleDeliveryUrlChange: (url: string) => void;
  handleThankYouMessageChange: (message: string) => void;

  // Emoji and color
  selectedEmoji: { id: string; emoji: string } | null;
  selectedColor: { id: string; value: string; light: string } | null;
  setSelectedEmoji: (emoji: { id: string; emoji: string } | null) => void;
  setSelectedColor: (
    color: { id: string; value: string; light: string } | null
  ) => void;
  isEmojiColorPickerOpen: boolean;
  setIsEmojiColorPickerOpen: (open: boolean) => void;

  // Validation
  generateSlug: (name: string) => string;
  isDuplicateName: boolean;

  // Submission
  isSubmitting: boolean;
  submitError: string | null;
  handleSubmit: (isEdit?: boolean, linkId?: string) => Promise<void>;

  // Reset
  resetForm: () => void;

  // Initialize for editing
  initializeForEdit: (linkData: any) => void;
}

const LinkFormContext = createContext<LinkFormContextType | undefined>(
  undefined
);

export const useLinkForm = () => {
  const context = useContext(LinkFormContext);
  if (!context) {
    throw new Error("useLinkForm must be used within a LinkFormProvider");
  }
  return context;
};

interface LinkFormProviderProps {
  children: React.ReactNode;
  mode?: "create" | "edit";
  initialTemplate?: PaymentTemplate | null;
  linkId?: string;
}

export const LinkFormProvider: React.FC<LinkFormProviderProps> = ({
  children,
  mode = "create",
  initialTemplate = null,
  linkId,
}) => {
  const { backendToken, me } = useAuth();
  const { refreshLinks, links, createLink } = useUser();
  const router = useRouter();
  const { trackPaymentLinkCreation, isPhotonAuthenticated } = usePhoton();

  // Template selection
  const [selectedTemplate, setSelectedTemplate] =
    useState<PaymentTemplate | null>(initialTemplate);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    thumbnail: null,
    useThumbnail: false,
    pricingType: "open",
    supportedChains: ["APTOS"],
    collectInfo: false,
    collectFields: {
      email: false,
      name: false,
      telegram: false,
    },
    useCustomTokens: false,
    stablecoinAmount: "",
    stablecoinToken: null,
    chainTokenConfigs: {},
    // Simplified stablecoin tracking
    isStable: false,
    stableToken: null,
    // Digital product specific
    deliverableFiles: [],
    deliveryUrl: "",
    thankYouMessage:
      "Thank you for your purchase! Your digital files are attached to this email. If you have any questions, feel free to reach out to me.",
    // Fundraising specific
    goalAmount: "",
  });

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Emoji and color state
  const [selectedEmoji, setSelectedEmoji] = useState<{
    id: string;
    emoji: string;
  } | null>(null);
  const [selectedColor, setSelectedColor] = useState<{
    id: string;
    value: string;
    light: string;
  } | null>(null);
  const [isEmojiColorPickerOpen, setIsEmojiColorPickerOpen] = useState(false);

  // Initialize with random emoji and color for create mode
  useEffect(() => {
    if (mode === "create" && selectedEmoji === null && selectedColor === null) {
      const randomEmoji =
        EMOJI_PICKS[Math.floor(Math.random() * EMOJI_PICKS.length)];
      const randomColor =
        COLOR_PICKS[Math.floor(Math.random() * COLOR_PICKS.length)];
      setSelectedEmoji(randomEmoji);
      setSelectedColor(randomColor);
    }
  }, [mode, selectedEmoji, selectedColor]);

  // For digital products, always ensure collectInfo is enabled and email is required
  useEffect(() => {
    if (selectedTemplate?.id === "digital-product") {
      setFormData((prev) => ({
        ...prev,
        collectInfo: true,
        collectFields: {
          ...prev.collectFields,
          email: true,
        },
      }));
    }
  }, [selectedTemplate]);

  // Generate slug from name
  const generateSlug = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }, []);

  // Check if current name would create a duplicate
  const isDuplicateName = useMemo(() => {
    if (!formData.name.trim()) return false;
    const currentSlug = generateSlug(formData.name);
    return links.some((link) => {
      if (mode === "edit" && link.id === linkId) {
        return false;
      }
      return link.tag === currentSlug && link.status === "ACTIVE";
    });
  }, [formData.name, generateSlug, links, mode, linkId]);

  const handleInputChange = useCallback((field: keyof FormData, value: any) => {
    setFormData((prev) => {
      if (Object.is(prev[field], value)) {
        return prev;
      }

      return { ...prev, [field]: value };
    });
  }, []);

  const handleCollectFieldChange = useCallback(
    (field: keyof FormData["collectFields"], checked: boolean) => {
      setFormData((prev) => ({
        ...prev,
        collectFields: {
          ...prev.collectFields,
          [field]: checked,
        },
      }));
    },
    []
  );

  const handleChainToggle = useCallback((chainId: string) => {
    setFormData((prev) => {
      const currentChains = prev.supportedChains;
      const isSelected = currentChains.includes(chainId);

      if (isSelected) {
        return {
          ...prev,
          supportedChains: currentChains.filter((id) => id !== chainId),
        };
      } else {
        return {
          ...prev,
          supportedChains: [...currentChains, chainId],
        };
      }
    });
  }, []);

  // Pricing handlers
  const handleStablecoinInputChange = useCallback((output: any) => {
    setFormData((prev) => ({
      ...prev,
      stablecoinAmount: output ? output.rawAmount : "",
      stablecoinToken: output ? output.token : null,
    }));
  }, []);

  const handleChainTokenInputChange = useCallback(
    (chainId: string, output: any) => {
      setFormData((prev) => ({
        ...prev,
        chainTokenConfigs: {
          ...prev.chainTokenConfigs,
          [chainId]: {
            token: output ? output.token : null,
            amount: output ? output.rawAmount : "",
          },
        },
      }));
    },
    []
  );

  const handlePricingTypeChange = useCallback(
    (type: "fixed" | "open" | "free") => {
      handleInputChange("pricingType", type);

      // For digital products, ensure collectInfo is enabled and email is required
      if (selectedTemplate?.id === "digital-product") {
        setFormData((prev) => ({
          ...prev,
          pricingType: type,
          collectInfo: true,
          collectFields: {
            ...prev.collectFields,
            email: true,
          },
        }));
      }
    },
    [handleInputChange, selectedTemplate]
  );

  const handleUseCustomTokensChange = useCallback(
    (value: boolean) => {
      setFormData((prev) => ({
        ...prev,
        useCustomTokens: value,
        // When switching to stablecoin mode (not custom tokens), mark as stable
        isStable: !value,
        stableToken: !value ? "USDC" : null,
      }));
    },
    []
  );

  // Digital product handlers
  const handleDeliverableFilesChange = useCallback(
    (files: DeliverableFile[]) => {
      handleInputChange("deliverableFiles", files);
    },
    [handleInputChange]
  );

  const handleDeliveryUrlChange = useCallback(
    (url: string) => {
      handleInputChange("deliveryUrl", url);
    },
    [handleInputChange]
  );

  const handleThankYouMessageChange = useCallback(
    (message: string) => {
      handleInputChange("thankYouMessage", message);
    },
    [handleInputChange]
  );

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      thumbnail: null,
      useThumbnail: false,
      pricingType: "open",
      supportedChains: ["APTOS"],
      collectInfo: false,
      collectFields: {
        email: false,
        name: false,
        telegram: false,
      },
      useCustomTokens: false,
      stablecoinAmount: "",
      stablecoinToken: null,
      chainTokenConfigs: {},
      // Simplified stablecoin tracking
      isStable: false,
      stableToken: null,
      deliverableFiles: [],
      deliveryUrl: "",
      thankYouMessage:
        "Thank you for your purchase! Your digital files are attached to this email. If you have any questions, feel free to reach out to me.",
      goalAmount: "",
    });
    setSelectedEmoji(null);
    setSelectedColor(null);
    setSubmitError(null);
  }, []);

  const initializeForEdit = useCallback((linkData: any) => {
    // Correctly map supported chains from IOTA_TESTNET/IOTA_MAINNET to APTOS
    const supportedChains = (linkData.supportedChains || []).map(
      (chain: string) => {
        const chainInfo = AVAILABLE_CHAINS.find(
          (c) => c.testnetKey === chain || c.mainnetKey === chain
        );
        return chainInfo ? chainInfo.id : chain;
      }
    );

    // Initialize form with existing link data
    const thumbnail = linkData.files?.thumbnail
      ? {
          url: getFileUrl(linkData.files.thumbnail.id),
          name: linkData.files.thumbnail.filename,
          size: linkData.files.thumbnail.size,
        }
      : null;

    const { amountType, chainConfigs } = linkData;
    const pricingType = (amountType || "open").toLowerCase();

    let useCustomTokens = false;
    let stablecoinAmount = "";
    let stablecoinToken = null;
    let newChainTokenConfigs = {};
    let isStable = false;
    let stableToken = null;

    if (pricingType === "fixed" && chainConfigs && chainConfigs.length > 0) {
      const firstConfig = chainConfigs[0];

      // Use new isStable field from backend if available
      if (linkData.isStable !== undefined) {
        isStable = linkData.isStable;
        stableToken = linkData.stableToken;
        useCustomTokens = !isStable;

        if (isStable) {
          stablecoinAmount = formatStringToNumericDecimals(
            String(firstConfig.amount || ""),
            firstConfig.mint?.decimals || 6
          );
          stablecoinToken = firstConfig.mint;
        } else {
          newChainTokenConfigs = chainConfigs.reduce((acc: any, config: any) => {
            const chainInfo = AVAILABLE_CHAINS.find(
              (c) =>
                c.testnetKey === config.chain || c.mainnetKey === config.chain
            );
            if (chainInfo) {
              acc[chainInfo.id] = {
                token: config.mint,
                amount: formatStringToNumericDecimals(
                  String(config.amount || ""),
                  config.mint?.decimals || 0
                ),
              };
            }
            return acc;
          }, {});
        }
      } else {
        // Fallback to legacy detection for older links
        const allAreUsdc = chainConfigs.every(
          (c: any) =>
            c.mint && isUsdcToken(c.mint.mintAddress, c.mint.symbol, c.mint.name)
        );
        const allSameAmount = chainConfigs.every(
          (c: any) => c.amount === firstConfig.amount
        );

        if (allAreUsdc && allSameAmount) {
          isStable = true;
          stableToken = "USDC";
          useCustomTokens = false;
          stablecoinAmount = formatStringToNumericDecimals(
            String(firstConfig.amount || ""),
            firstConfig.mint?.decimals || 6
          );
          stablecoinToken = firstConfig.mint;
        } else {
          isStable = false;
          useCustomTokens = true;
          newChainTokenConfigs = chainConfigs.reduce((acc: any, config: any) => {
            const chainInfo = AVAILABLE_CHAINS.find(
              (c) =>
                c.testnetKey === config.chain || c.mainnetKey === config.chain
            );
            if (chainInfo) {
              acc[chainInfo.id] = {
                token: config.mint,
                amount: formatStringToNumericDecimals(
                  String(config.amount || ""),
                  config.mint?.decimals || 0
                ),
              };
            }
            return acc;
          }, {});
        }
      }
    }

    setFormData({
      name: linkData.label || "",
      description: linkData.description || "",
      thumbnail: thumbnail,
      useThumbnail: !!linkData.files?.thumbnail,
      pricingType: pricingType,
      supportedChains: supportedChains,
      collectInfo: linkData.collectInfo || false,
      collectFields: linkData.collectFields || {
        email: false,
        name: false,
        telegram: false,
      },
      useCustomTokens: useCustomTokens,
      stablecoinAmount: stablecoinAmount,
      stablecoinToken: stablecoinToken,
      chainTokenConfigs: newChainTokenConfigs,
      // Simplified stablecoin tracking
      isStable: isStable,
      stableToken: stableToken,
      deliverableFiles: (linkData.files?.deliverables || []).map((file: any) => ({
        id: file.id,
        name: file.filename || file.name,
        size: file.size || 0,
        isExisting: true,
        url: file.url || getFileUrl(file.id), // Use URL directly if available, otherwise construct from ID
      })),
      deliveryUrl: linkData.deliveryUrl || "",
      thankYouMessage:
        linkData.thankYouMessage ||
        "Thank you for your purchase! Your digital files are attached to this email. If you have any questions, feel free to reach out to me.",
      goalAmount: linkData.goalAmount || "",
    });

    // Set emoji and color
    const emoji = EMOJI_PICKS.find((e) => e.id === linkData.emoji);
    const color = COLOR_PICKS.find((c) => c.id === linkData.backgroundColor);

    setSelectedEmoji(emoji || EMOJI_PICKS[0]);
    setSelectedColor(color || COLOR_PICKS[0]);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!backendToken) {
      console.error("No backend token available");
      return;
    }

    if (!formData.name.trim()) {
      console.error("Link name is required");
      return;
    }

    if (!selectedEmoji || !selectedColor) {
      console.error("Emoji and color are required");
      return;
    }

    if (!selectedTemplate) {
      console.error("Template is required");
      return;
    }

    // Check for duplicate link names (only for create mode)
    if (mode !== "edit") {
      const currentSlug = generateSlug(formData.name);
      const existingLink = links.find(
        (link) => link.tag === currentSlug && link.status === "ACTIVE"
      );
      if (existingLink) {
        setSubmitError(
          `A link with this name already exists: "${existingLink.label}". Please choose a different name.`
        );
        return;
      }
    }

    // Template-specific validation
    if (selectedTemplate.id === "digital-product") {
      if (
        formData.deliverableFiles.length === 0 &&
        !formData.deliveryUrl.trim()
      ) {
        console.error("At least one deliverable (file or URL) is required");
        return;
      }
    }

    // Pricing validation
    if (formData.pricingType === "fixed") {
      // For fundraisers, validate goal amount instead of pricing
      if (selectedTemplate?.id === "fundraiser") {
        if (!formData.goalAmount || !formData.stablecoinToken) {
          console.error("Fundraising goal amount and token are required");
          return;
        }
      } else {
        // For non-fundraiser templates, validate pricing
        if (!formData.useCustomTokens) {
          if (!formData.stablecoinAmount || !formData.stablecoinToken) {
            console.error(
              "Stablecoin amount and token are required for fixed pricing"
            );
            return;
          }
        } else {
          for (const chainId of formData.supportedChains) {
            const chainConfig = formData.chainTokenConfigs[chainId];
            if (!chainConfig || !chainConfig.amount || !chainConfig.token) {
              console.error(
                `Token amount and token are required for chain ${chainId}`
              );
              return;
            }
          }
        }
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const slug = generateSlug(formData.name);

      // Map chains to their correct identifiers (APTOS -> APTOS_TESTNET or APTOS_MAINNET)
      const mappedChains = formData.supportedChains.map((chainId) => {
        if (chainId === "APTOS") {
          return isTestnet ? "APTOS_TESTNET" : "APTOS_MAINNET";
        }
        return chainId;
      });

      // Create chain configs
      const chainConfigs = mappedChains.map((chainId) => {
        const chainConfig = CHAINS[chainId as keyof typeof CHAINS];
        if (!chainConfig) {
          throw new Error(`Chain configuration not found for ${chainId}`);
        }

        if (formData.pricingType === "fixed") {
          if (!formData.useCustomTokens) {
            const selectedToken = formData.stablecoinToken;
            let tokenInfo = null;

            if (selectedToken) {
              tokenInfo = chainConfig.tokens.find(
                (token) =>
                  token.address === selectedToken.address ||
                  (token.symbol === selectedToken.symbol &&
                    token.symbol === "USDC")
              );

              if (!tokenInfo) {
                tokenInfo = chainConfig.tokens.find(
                  (token) => token.symbol === selectedToken.symbol
                );
              }
            }

            // For fundraisers, use goalAmount; for others, use stablecoinAmount
            const amountToUse = selectedTemplate?.id === "fundraiser"
              ? formData.goalAmount
              : formData.stablecoinAmount;

            return {
              chain: chainId,
              amount: serializeFormattedStringToFloat(amountToUse),
              isEnabled: true,
              mint: tokenInfo?.address || selectedToken?.address || null,
              isNative: tokenInfo?.isNative || selectedToken?.isNative || false,
            };
          } else {
            const originalChainId = Object.keys(
              formData.chainTokenConfigs
            ).find((key) => {
              if (
                key === "APTOS" &&
                chainId === (isTestnet ? "APTOS_TESTNET" : "APTOS_MAINNET")
              )
                return true;
              return key === chainId;
            });

            const chainTokenConfig = originalChainId
              ? formData.chainTokenConfigs[originalChainId]
              : null;
            const selectedToken = chainTokenConfig?.token;

            return {
              chain: chainId,
              amount: chainTokenConfig?.amount
                ? serializeFormattedStringToFloat(chainTokenConfig.amount)
                : null,
              isEnabled: true,
              mint: selectedToken?.address || null,
              isNative: selectedToken?.isNative || false,
            };
          }
        } else {
          return {
            chain: chainId,
            amount: null,
            isEnabled: true,
            mint: null,
          };
        }
      });

      // Calculate isStable and stableToken based on actual pricing configuration
      const isUsingStablecoin = formData.pricingType === "fixed" && !formData.useCustomTokens;
      const actualIsStable = isUsingStablecoin;
      const actualStableToken = isUsingStablecoin ? "USDC" : null;

      // Prepare request data
      const requestData = {
        emoji: selectedEmoji.id,
        backgroundColor: selectedColor.id,
        tag: slug,
        label: formData.name,
        description: formData.description || undefined,
        specialTheme: "default",
        template: selectedTemplate.id,
        amountType: formData.pricingType,
        supportedChains: mappedChains,
        chainConfigs: chainConfigs,
        collectInfo: formData.collectInfo,
        collectFields: formData.collectInfo
          ? formData.collectFields
          : undefined,
        // Simplified stablecoin tracking
        isStable: actualIsStable,
        stableToken: actualStableToken,
        // Template-specific fields
        ...(selectedTemplate.id === "digital-product" && {
          deliveryUrl: formData.deliveryUrl || undefined,
          thankYouMessage: formData.thankYouMessage,
        }),
        ...(selectedTemplate.id === "fundraiser" && {
          goalAmount: formData.goalAmount,
        }),
      };

      // Create FormData payload
      const formDataPayload = new FormData();

      Object.entries(requestData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === "object") {
            formDataPayload.append(key, JSON.stringify(value));
          } else {
            formDataPayload.append(key, String(value));
          }
        }
      });

      // Add files
      if (formData.useThumbnail && formData.thumbnail) {
        if (formData.thumbnail instanceof File) {
          formDataPayload.append("thumbnail", formData.thumbnail);
        }
      }

      if (selectedTemplate.id === "digital-product") {
        // In edit mode, always send existing file IDs to properly manage them
        if (mode === "edit") {
          const existingFileIds = formData.deliverableFiles
            .filter((f) => f.isExisting)
            .map((f) => f.id);

          // Always send the array, even if empty, so backend knows to manage deliverables
          formDataPayload.append("existingDeliverableIds", JSON.stringify(existingFileIds));
        }

        // Only send new files (not existing ones)
        const newFiles = formData.deliverableFiles.filter(
          (deliverableFile) => !deliverableFile.isExisting && deliverableFile.file
        );
        newFiles.forEach((deliverableFile, index) => {
          formDataPayload.append(
            `deliverableFile_${index}`,
            deliverableFile.file!
          );
        });
      }

      const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

      if (mode === "edit" && linkId) {
        const response = await linksService.updateLinkFormData(
          backendToken,
          linkId,
          formDataPayload
        );

        if (response.error) {
          throw new Error(response.error);
        }

        await refreshLinks();
        router.push(`/app/links/${linkId}`);
      } else {
        // Create new link - Backend-less mode
        // For digital products, upload files first if they exist
        let uploadedDeliverables: any[] = [];
        
        if (selectedTemplate.id === "digital-product" && formData.deliverableFiles.length > 0) {
          try {
            console.log("📤 Uploading deliverable files to Supabase Storage...");
            
            // Filter out existing files (they already have URLs)
            const newFiles = formData.deliverableFiles.filter(
              (file) => !file.isExisting && file.file
            );
            
            if (newFiles.length > 0) {
              // Upload files to Supabase Storage
              const filesToUpload = newFiles.map((f) => f.file!);
              const folder = me?.id ? `users/${me.id}/deliverables` : 'deliverables';
              
              const uploadedFiles = await uploadFiles(filesToUpload, 'deliverables', folder);
              
              // Map uploaded files to deliverable format
              uploadedDeliverables = uploadedFiles.map((uploaded, index) => ({
                id: uploaded.id,
                url: uploaded.url,
                filename: uploaded.name,
                size: uploaded.size,
                contentType: uploaded.contentType,
                type: 'deliverable',
                category: null,
              }));
              
              console.log(`✅ Successfully uploaded ${uploadedDeliverables.length} deliverable files`);
            }
            
            // Include existing files (they already have URLs)
            const existingFiles = formData.deliverableFiles
              .filter((f) => f.isExisting && f.url)
              .map((f) => ({
                id: f.id,
                url: f.url!,
                filename: f.name,
                size: f.size,
                contentType: 'application/octet-stream',
                type: 'deliverable',
                category: null,
              }));
            
            uploadedDeliverables = [...existingFiles, ...uploadedDeliverables];
          } catch (uploadError) {
            console.error("❌ Error uploading deliverable files:", uploadError);
            throw new Error(
              `Failed to upload deliverable files: ${
                uploadError instanceof Error ? uploadError.message : "Unknown error"
              }`
            );
          }
        }
        
        // Add uploaded deliverables to requestData
        const requestDataWithFiles = {
          ...requestData,
          ...(selectedTemplate.id === "digital-product" && uploadedDeliverables.length > 0 && {
            deliverables: uploadedDeliverables,
          }),
        };
        
        const newLink = await createLink(requestDataWithFiles);
        
        if (!newLink) {
          throw new Error("Failed to create link");
        }

        // Track payment link creation with Photon (only for authenticated Photon users)
        if (isPhotonAuthenticated() && newLink.id) {
          try {
            await trackPaymentLinkCreation(newLink.id, {
              template: selectedTemplate.id,
              pricingType: formData.pricingType,
              supportedChains: mappedChains,
            });
          } catch (error) {
            // Log error but don't block the user flow
            console.error("Failed to track payment link creation:", error);
          }
        }

        await refreshLinks();
        router.push("/app/links");
      }
    } catch (error) {
      console.error("Error submitting link:", error);

      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          `Failed to ${
            mode === "edit" ? "update" : "create"
          } link. Please try again.`;
        setSubmitError(
          `${errorMessage} (Status: ${error.response?.status || "Unknown"})`
        );
      } else {
        setSubmitError(
          error instanceof Error
            ? error.message
            : `Failed to ${
                mode === "edit" ? "update" : "create"
              } link. Please try again.`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    backendToken,
    me,
    formData,
    selectedEmoji,
    selectedColor,
    selectedTemplate,
    generateSlug,
    links,
    refreshLinks,
    router,
    mode,
    linkId,
  ]);

  const value = useMemo(
    () => ({
      selectedTemplate,
      setSelectedTemplate,
      formData,
      handleInputChange,
      handleCollectFieldChange,
      handleChainToggle,
      handleStablecoinInputChange,
      handleChainTokenInputChange,
      handlePricingTypeChange,
      handleUseCustomTokensChange,
      handleDeliverableFilesChange,
      handleDeliveryUrlChange,
      handleThankYouMessageChange,
      selectedEmoji,
      selectedColor,
      setSelectedEmoji,
      setSelectedColor,
      isEmojiColorPickerOpen,
      setIsEmojiColorPickerOpen,
      generateSlug,
      isDuplicateName,
      isSubmitting,
      submitError,
      handleSubmit,
      resetForm,
      initializeForEdit,
    }),
    [
      selectedTemplate,
      setSelectedTemplate,
      formData,
      handleInputChange,
      handleCollectFieldChange,
      handleChainToggle,
      handleStablecoinInputChange,
      handleChainTokenInputChange,
      handlePricingTypeChange,
      handleUseCustomTokensChange,
      handleDeliverableFilesChange,
      handleDeliveryUrlChange,
      handleThankYouMessageChange,
      selectedEmoji,
      selectedColor,
      setSelectedEmoji,
      setSelectedColor,
      isEmojiColorPickerOpen,
      setIsEmojiColorPickerOpen,
      generateSlug,
      isDuplicateName,
      isSubmitting,
      submitError,
      handleSubmit,
      resetForm,
      initializeForEdit,
    ]
  );

  return (
    <LinkFormContext.Provider value={value}>
      {children}
    </LinkFormContext.Provider>
  );
};
